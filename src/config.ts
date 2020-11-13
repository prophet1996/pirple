/**
 *
 * Create and export configuration variables
 *
 */

import { env } from 'process';

const environment:any = {

};

// Staging (default) environment

environment.staging = {
  port: 3000,
  envName: 'staging',
};

// Prod environment

environment.prod = {
  port: 5000,
  envName: 'prod',
};

const currEnv = typeof (process.env.NODE_ENV) === 'string'
  ? process.env.NODE_ENV?.toLowerCase() : '';

const envToExport = typeof (environment[currEnv]) === 'object' ? environment[currEnv] : environment.staging;

export default envToExport;
