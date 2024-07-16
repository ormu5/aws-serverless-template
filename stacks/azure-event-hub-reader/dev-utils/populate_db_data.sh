#!/bin/bash
#
# This script passes a number of csv files to an s3 bucket in order to populate the MySQL database
#
AWS_ACCESS_KEY_ID=S3RVER
AWS_SECRET_ACCESS_KEY=S3RVER
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY

endpoint=http://localhost:4569
target_bucket=s3://batchDataLoaderBucket
target_bucket_dir=pending/local
target_location=${target_bucket}\/${target_bucket_dir}

files=(
"app.task.csv"
"app.op_schedule.csv"
"app.scheduled_task_event.csv"
)

for file in "${files[@]}"
do
   :
   aws --endpoint ${endpoint} s3 cp sample-data/${file} ${target_location}/${file}
   sleep 12
done
