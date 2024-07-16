#!/bin/bash

echo Enabling network connections and restarting database to work around default setting preventing network connections.
pg_ctl -o "-c listen_addresses='localhost'" -w restart
