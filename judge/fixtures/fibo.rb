#!/usr/bin/env ruby

def fiboR(n)
    return n if n < 2
    return fiboR(n-1) + fiboR(n-2)
end

puts fiboR(gets.chomp.to_i())
