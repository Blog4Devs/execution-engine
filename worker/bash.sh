#!/bin/sh
#ulimit -u 10   
#ulimit -m 524288
while true; do
    echo -n "custom_shell$ "
    read -r cmd
    if [ "$cmd" = "exit" ]; then
        echo "haha"
    else 
        sudo $cmd
 
    fi
done