## Algossupot이란?
숭실대학교의 과제를 위한 온라인 채점 서비스


## 테이블 생성
테이블 생성 쿼리 호출 위치를 생각 중
현재 수동으로 쿼리날려서 생성해야되므로 여기에다가 임시로 남김

### 유저 (User)
```sql
CREATE TABLE `algossupot`.`user` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(32) NOT NULL,
  `email` VARCHAR(64) NOT NULL,
  `password` CHAR(32) NOT NULL,
  PRIMARY KEY (`id`,`name`),
  UNIQUE KEY `name` (`name`)
);
```

### 문제 (Problem)
```sql
CREATE TABLE `algossupot`.`problem` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(64) NOT NULL,
  `content` TEXT NULL,
  PRIMARY KEY (`id`, `title`),
  UNIQUE INDEX `title_UNIQUE` (`title` ASC));
```

### 제출 상태 (Submission)
```sql
CREATE TABLE `algossupot`.`submission` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `problemId` INT UNSIGNED NOT NULL,
  `userId` INT UNSIGNED NOT NULL,
  `language` VARCHAR(64) CHARACTER SET 'utf8mb4' NOT NULL,
  `state` SMALLINT UNSIGNED NOT NULL,
  `codeLength` INT UNSIGNED NOT NULL,
  `timestamp` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `problemid_id_idx` (`problemId` ASC),
  INDEX `userid_id_idx` (`userId` ASC),
  CONSTRAINT `fk_problemId`
    FOREIGN KEY (`problemId`)
    REFERENCES `algossupot`.`problem` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_userId`
    FOREIGN KEY (`userId`)
    REFERENCES `algossupot`.`user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);
```
