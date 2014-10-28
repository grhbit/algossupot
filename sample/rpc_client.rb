#!/usr/bin/env ruby
# encoding: utf-8

require "json"
require "bunny"

conn = Bunny.new('amqp://localhost:5672')
conn.start

ch = conn.create_channel

class FibonacciClient
  attr_reader :reply_queue

  def initialize(ch, server_queue)
    @ch = ch
    @x = ch.default_exchange

    @server_queue = server_queue
    @reply_queue = ch.queue("", :exclusive => true)
  end

  def call(n)
    correlation_id = self.generate_uuid

    @x.publish(n.to_s,
      :routing_key => @server_queue,
      :correlation_id => correlation_id,
      :reply_to => @reply_queue.name)

    response = nil
    @reply_queue.subscribe(:block => true) do |delivery_info, properties, payload|
      if properties[:correlation_id] == correlation_id
        response = payload

        delivery_info.consumer.cancel
      end
    end

    response
  end

  protected

  def generate_uuid
    "#{rand}#{rand}#{rand}"
  end
end

path = `pwd`.chomp!

problem = JSON.parse(File.read(File.join(path, 'index.json')))
problem['path'] = path

client = FibonacciClient.new(ch, "rpc_queue")
puts " [x] Requesting sandbox()"
response = client.call({
  "source"=>{
    "path"=>File.join(path, "main.cpp"),
    "language"=>"cpp"
  },
  "problem"=>problem
}.to_json)
puts " [.] Got #{response}"

ch.close
conn.close
