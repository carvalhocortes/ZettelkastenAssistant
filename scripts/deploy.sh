#!/bin/bash
set -ex

STAGE=${1}

npm install
export AWS_PROFILE=personal
npx serverless deploy --verbose --stage $STAGE
