#!/usr/bin/env bash

# Abort commit if there are failing unit tests
echo "Running pre-commit hook"

# If commit is done not via command line (e.g. Source Tree), the environment
# variables are not the same as global variables, need to add location of node
export PATH=/usr/local/bin:$PATH

npm test
RESULT=$?
[ $RESULT -ne 0 ] && echo "Tests failed, aborting the commit" && exit 1
echo "All tests passed, commiting your changes" && exit 0
