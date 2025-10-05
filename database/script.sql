CREATE TABLE users
(
  id    bigserial    NOT NULL,
  name  varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  password varchar(512) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE to_do_plan
(
  id       bigserial    NOT NULL,
  name     varchar(128) NOT NULL,
  owner_id bigint       NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE to_do_list
(
  id        bigserial NOT NULL,
  owner_id  bigint    NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE to_do_item
(
  id          bigserial    NOT NULL,
  list_id     bigint       NOT NULL,
  item_order  int          NOT NULL,
  name        varchar(128) NOT NULL,
  description varchar(512),
  done        boolean      NOT NULL DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE steps
(
  id        bigserial NOT NULL,
  plan_id   bigint    NOT NULL,
  step_order int      NOT NULL,
  list_id   bigint    NOT NULL,
  PRIMARY KEY (id)
);

ALTER TABLE to_do_list
  ADD CONSTRAINT fk_users_to_to_do_list
    FOREIGN KEY (owner_id)
    REFERENCES users (id);

ALTER TABLE to_do_item
  ADD CONSTRAINT fk_to_do_list_to_to_do_item
    FOREIGN KEY (list_id)
    REFERENCES to_do_list (id);

ALTER TABLE steps
  ADD CONSTRAINT fk_to_do_plan_to_steps
    FOREIGN KEY (plan_id)
    REFERENCES to_do_plan (id);

ALTER TABLE to_do_plan
  ADD CONSTRAINT fk_users_to_to_do_plan
    FOREIGN KEY (owner_id)
    REFERENCES users (id);

ALTER TABLE steps
  ADD CONSTRAINT fk_to_do_list_to_steps
    FOREIGN KEY (list_id)
    REFERENCES to_do_list (id);
