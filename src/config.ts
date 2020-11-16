/**
 *
 * Create and export configuration variables
 *
 */

const environment:any = {

};

// Staging (default) environment

environment.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'thisIsascret',
  maxChecks: 5,
  defaultMethods: ['GET', 'POST', 'PUT', 'DELETE'],
};

// Prod environment

environment.prod = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: 'prod',
  hashingSecret: 'thisIsAlsoascret',
  maxChecks: 5,
  defaultMethods: ['GET', 'POST', 'PUT', 'DELETE'],

};

const currEnv = typeof (process.env.NODE_ENV) === 'string'
  ? process.env.NODE_ENV?.toLowerCase() : '';

const envToExport = typeof (environment[currEnv]) === 'object' ? environment[currEnv] : environment.staging;

export default envToExport;
