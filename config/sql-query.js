var Query = {
  User: {
    loadById: 'SELECT * FROM `algossupot`.`user` WHERE id=:id LIMIT 1 ;',
    loadByName: 'SELECT * FROM `algossupot`.`user` WHERE name=:name LIMIT 1 ;',
    signUp: 'INSERT INTO `algossupot`.`user` (name, email, password) SELECT :name, :email, :password FROM DUAL WHERE NOT EXISTS ( SELECT * FROM `algossupot`.`user` WHERE name = :name ) ;',
    Static: {
      createTable: '',
      loadByIds: 'SELECT * FROM `algossupot`.`user` WHERE id IN(:ids) ;',
      loadByNames: 'SELECT * FROM `algossupot`.`user` WHERE name IN(:names) ;'
    }
  },
  Submission: {
    findById: 'SELECT * FROM `algossupot`.`submission` WHERE id=:id LIMIT 1 ;',
    pushSubmit: 'INSERT INTO `algossupot`.`submission` (`problemId`, `userId`, `language`, `state`, `codeLength`, `timestamp`) SELECT :problemId, :userId, :language, :state, :codeLength, :timestamp FROM DUAL WHERE EXISTS (SELECT * FROM `algossupot`.`user` WHERE id = :userId) ;',
    Static: {
      createTable: '',
      loadByIds: 'SELECT * FROM `algossupot`.`submission` WHERE id IN(:ids) ;'
    }
  }
};

module.exports = Query;
