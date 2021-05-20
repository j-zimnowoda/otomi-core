#!/bin/bash
function create_named_volume() {
  [ "$(
    docker volume inspect otomi-vol &>/dev/null
    echo $?
  )" -eq 1 ] && docker volume create otomi-vol
}

create_named_volume
