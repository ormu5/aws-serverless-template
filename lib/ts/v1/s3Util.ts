import {
  DeleteObjectCommandInput,
  DeleteObjectCommandOutput,
  GetObjectCommandInput,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  ObjectCannedACL,
  S3,
} from "@aws-sdk/client-s3";
import * as crypto from 'crypto';
import initConstants from "./initConstants";
import { logger } from './utilities';

const DIFFERENTIATOR_LENGTH = 6;
const S3_FAILURE_FOLDER = 'errored';
const S3_SUCCESS_FOLDER = 'archived';

const OFFLINE_ENDPOINT_URL = 'http://localhost:4569';
const OFFLINE_ACCESS_KEY_ID = 'S3RVER';
const OFFLINE_SECRET_ACCESS_KEY = 'S3RVER';

let s3Client: S3;

if (initConstants.IS_DEPLOYED) {
  s3Client = new S3();
} else {
  s3Client = new S3({
    credentials: {
      accessKeyId: OFFLINE_ACCESS_KEY_ID,
      secretAccessKey: OFFLINE_SECRET_ACCESS_KEY
    },
    endpoint: OFFLINE_ENDPOINT_URL
  });
}

function getFilenameFromObjectKey(objectKey: string): string {
  return objectKey.split('/').pop() || '';
}

function buildS3ObjectKey(filename: string, baseFolder?: string, subFolder: string = S3_SUCCESS_FOLDER,
                          includeDifferentiator: boolean = true): string {

  const differentiator = includeDifferentiator ?
    '-' + crypto.randomBytes(DIFFERENTIATOR_LENGTH).toString('hex').toUpperCase() : '';
  const t = new Date();
  const currentDate = `${t.getUTCFullYear()}-${(t.getUTCMonth() + 1)
    .toString()
    .padStart(2, '0')}-${t.getUTCDate()
      .toString()
      .padStart(2, '0')}`;
  const baseFolderPrefix = baseFolder ? baseFolder + '/' : '';

  return (
    baseFolderPrefix + subFolder + `/${currentDate}/` + filename + differentiator
  );
}

function putS3Object(bucketName: string, objectKey: string, data: string,
  metadata: Map<string, string>, acl: string = 'bucket-owner-full-control'): Promise<PutObjectCommandOutput> {

  const convertedMetadata: Record<string, string> = {};

  for (const [key, value] of Object.entries(metadata)) {
    convertedMetadata[key] = value;
  }

  const params: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: objectKey,
    Body: data,
    ACL: ObjectCannedACL[acl],
    Metadata: {
      ...convertedMetadata
    }
  };

  return s3Client.putObject(params);
}

function getS3Object(bucketName: string, objectKey: string): Promise<string> {

  const params: GetObjectCommandInput = {
    Bucket: bucketName,
    Key: objectKey,
  };

  return s3Client
    .getObject(params)
    .then((response) => response.Body.transformToString() || '');
}

function deleteS3Object(bucketName: string, objectKey: string): Promise<DeleteObjectCommandOutput> {

  logger.info(`Deleting ${objectKey} from ${bucketName}.`);
  const params: DeleteObjectCommandInput = {
    Bucket: bucketName,
    Key: objectKey,
  };

  return s3Client.deleteObject(params);
}

export {
  getFilenameFromObjectKey,
  buildS3ObjectKey,
  putS3Object,
  getS3Object,
  deleteS3Object,
  S3_SUCCESS_FOLDER,
  S3_FAILURE_FOLDER,
};