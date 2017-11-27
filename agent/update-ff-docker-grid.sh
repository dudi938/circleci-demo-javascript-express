#!/bin/bash

set -x

EXT_HEADLESS_URL="https://testimstatic.blob.core.windows.net/extension/testim-firefox-profile.zip"
EXT_ETAG_FILE="/var/run/testim-ff-headless"

EXT_URL_ETAG=$(curl -sI -X HEAD $EXT_HEADLESS_URL | tr -d '\r' | sed -En 's/^ETag: (.*)/\1/p')
EXT_URL_LAST_MODIFIED=$(curl -sI -X HEAD $EXT_HEADLESS_URL | tr -d '\r' | sed -En 's/^Last-Modified: (.*)/\1/p')

if [ -f "$EXT_ETAG_FILE" ]
then
  EXT_FILE_ETAG=$(cat ${EXT_ETAG_FILE})
  if [ "$EXT_URL_ETAG" != "$EXT_FILE_ETAG" ]
  then
    echo "Update selenium grid with extension from ${EXT_URL_LAST_MODIFIED}"
    cd /opt/testim

    echo "Pull latest firefox docker image"
    OUTPUT=$(docker-compose pull firefox)
    if echo $OUTPUT | grep -q 'Downloaded newer image'; then
      echo "Pull latest hub docker image"
      docker-compose pull hub

      echo "Recreating firefox dockers"
      docker-compose up -d --scale firefox=@numOfInstances@

      echo $EXT_URL_ETAG > $EXT_ETAG_FILE
    fi
  else
    echo "Selenium grid already working with the latest version from ${EXT_URL_LAST_MODIFIED}"
  fi
else
  cd /opt/testim
  docker-compose pull
  docker-compose up -d --scale firefox=@numOfInstances@
  echo "Failed to find ETAG file - ${EXT_ETAG_FILE} insert latest ETAG to file ${EXT_ETAG_FILE}"
  echo $EXT_URL_ETAG > $EXT_ETAG_FILE
fi
