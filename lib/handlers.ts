/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { nanoid } from 'nanoid';
import _data from './data';
import { Hash, createRandomString } from './helpers';
import config from '../src/config';

const { defaultMethods, maxChecks } = config;
const handlers:any = {
  ping: (data:any, callback:any) => {
    callback(200);
  },
  notFound: (_:any, callback:any) => {
    callback(400);
  },
  _users: {
    // Required data: firstName, lastName, phone, password, tosAgreement
    post: (data:any = {}, callback:any) => {
      // validations
      const { payload = {} } = data;
      let {
        firstName = '', lastName = '', phone = '', tosAgreement = false,
      } = payload;
      const { password } = payload;
      firstName = firstName.trim();
      lastName = lastName.trim();
      phone = phone.trim();
      phone = phone.length === 10 ? phone : '';
      tosAgreement = !!tosAgreement;

      if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure the user doesn't exist

        _data.read('users', phone, (err:string) => {
          if (err) {
            // hash the password
            const hashedPassword = Hash(password);
            if (hashedPassword) {
              const userObject = {
                firstName,
                lastName,
                phone,
                hashedPassword,
                tosAgreement,
              };
              _data.create('users', phone, userObject, (createErr:string) => {
                if (!createErr) {
                  callback(204);
                } else {
                  callback(500, { Error: 'Could Not create user', createErr });
                }
              });
            } else {
              callback(500, { Error: 'Could not has the password' });
            }
          } else {
            // User already exist
            callback(400, { Error: 'A user with that phone already exist' });
          }
        });
      } else {
        callback(400, { Error: 'Missing required fields' });
      }
    },
    // Required: phone
    // optional : anyone of the data
    //  @TODO: only let autheticated users access their objects not anyone else's

    put: (data:any, callback:any) => {
      // validations
      const { payload = {} } = data;
      let {
        firstName = '', lastName = '', phone = '', tosAgreement = true,
      } = payload;
      const { password } = payload;
      firstName = firstName.trim();
      lastName = lastName.trim();
      phone = phone.trim();
      phone = phone.length === 10 ? phone : '';
      tosAgreement = !!tosAgreement;

      if (phone && tosAgreement && (firstName || lastName || password)) {
        // Make sure the user doesn't exist
        const { headers: { token = '' } = {} } = data;
        handlers._tokens.verifyToken(token, phone, (tokenIsValid:boolean) => {
          if (tokenIsValid) {
            _data.read('users', phone, (err:string, userData:any) => {
              if (!err && userData) {
                // hash the password
                const { firstName: storedFirstName, lastName: storedLastName } = userData;

                let { hashedPassword } = userData;
                hashedPassword = password ? Hash(password) : hashedPassword;
                firstName = firstName || storedFirstName;
                lastName = lastName || storedLastName;
                if (hashedPassword) {
                  const userObject = {
                    firstName,
                    lastName,
                    phone,
                    hashedPassword,
                    tosAgreement: true,
                  };
                  _data.update('users', phone, userObject, (createErr:string) => {
                    if (!createErr) {
                      callback(204);
                    } else {
                      callback(500, { Error: 'Could Not create user', createErr });
                    }
                  });
                } else {
                  callback(500, { Error: 'Could not hash the password' });
                }
              } else {
                // User already exist
                callback(400, { Error: 'The user with that phone does not exist' });
              }
            });
          } else {
            callback(403, { Error: 'Missing token' });
          }
        });
      } else {
        callback(400, { Error: 'Missing required fields' });
      }
    },

    get: (data:any, callback:any) => {
      // check the phone no is valid
      const { query = {} } = data;
      let { phone = '' } = query;
      phone = phone.length === 10 ? phone : '';
      if (phone) {
        const { headers: { token = '' } = {} } = data;
        handlers._tokens.verifyToken(token, phone, (tokenIsValid:boolean) => {
          if (tokenIsValid) {
            _data.read('users', phone, (readErr:string, userData:any) => {
              if (!readErr && userData) {
                const foundData = { ...userData, hashedPassword: undefined };
                callback(200, foundData);
              } else {
                callback(404);
              }
            });
          } else {
            callback(403, { Error: 'Missing token' });
          }
        });
      } else {
        callback(400, { Error: 'Missing required phone no.', data });
      }
    },
    delete: (data:any, callback:any) => {
      // check the phone no is valid
      const { query = {} } = data;
      let { phone = '' } = query;
      phone = phone.length === 10 ? phone : '';
      if (phone) {
        const { headers: { token = '' } = {} } = data;
        handlers._tokens.verifyToken(token, phone, (tokenIsValid:boolean) => {
          if (tokenIsValid) {
            _data.read('users', phone, (readErr:string, userData:any) => {
              if (!readErr && userData) {
                _data.delete('users', phone, (deleteErr:any) => {
                  if (!deleteErr) callback(200, { phone: userData.phone });
                  else {
                    callback(500, { Error: 'Couldn;t delete user' });
                  }
                });
              } else {
                callback(404);
              }
            });
          } else {
            callback(403, { Error: 'Missing token' });
          }
        });
      } else {
        callback(400, { Error: 'Missing required phone no.', data });
      }
    },
  },
  users: (data:any, callback:any) => {
    const acceptableMethods = ['post', 'put', 'get', 'delete'];
    if (acceptableMethods.indexOf(data.method) !== -1) {
      // eslint-disable-next-line no-underscore-dangle
      handlers._users[data.method](data, callback);
    } else {
      callback(405);
    }
  },
  _tokens: {
    // Required data: firstName, lastName, phone, password, tosAgreement
    post: (data:any = {}, callback:any) => {
      // validations
      const { payload = {} } = data;
      let {
        phone = '',
      } = payload;
      const { password = '' } = payload;
      phone = phone.trim();
      phone = phone.length === 10 ? phone : '';

      if (phone && password) {
        // Make sure the user doesn't exist

        _data.read('users', phone, (err:string, userData:any) => {
          if (!err && userData) {
            // hash the password
            const hashedPassword = Hash(password);
            if (hashedPassword === userData.hashedPassword) {
              // valid user and password, create a token and set expiration 1 hr
              const tokenId = createRandomString(20);
              const expires = Date.now() + 1000 * 60 * 60;
              const tokenObject = {
                phone,
                id: tokenId,
                expires,
              };

              _data.create('tokens', tokenId, tokenObject, (createTokenErr:string) => {
                if (!createTokenErr) {
                  callback(200, tokenObject);
                } else {
                  callback(500, { Error: 'Could Not create user', createTokenErr });
                }
              });
            } else {
              callback(400, { Error: 'Password does not match' });
            }
          } else {
            // User already exist
            callback(400, { Error: 'Could not find the user' });
          }
        });
      } else {
        callback(400, { Error: 'Missing required fields' });
      }
    },
    // Required: phone
    // optional : anyone of the data
    //  @TODO: only let autheticated users access their objects not anyone else's

    put: (data:any, callback:any) => {
      // validations
      const { payload = {} } = data;
      const {
        id = '', extend = false,
      } = payload;

      if (id && extend) {
        // Make sure the user doesn't exist

        _data.read('tokens', id, (err:string, tokenData:any) => {
          if (!err && tokenData) {
            if (tokenData.expires > Date.now()) {
              _data.update('tokens', id, { ...tokenData, expires: Date.now() + 1000 * 60 * 60 }, (extendErr:string) => {
                if (!extendErr) {
                  callback(204);
                } else {
                  callback(500, { Error: 'Could Not extend token', extendErr });
                }
              });
            } else {
              callback(400, { Error: 'Token has expired' });
            }
          } else {
            callback(400, { Error: 'The token does not exist', tokenData });
          }
        });
      } else {
        callback(400, { Error: 'Missing required fields' });
      }
    },
    // required: id
    get: (data:any, callback:any) => {
      // check the id is valid
      const { query = {} } = data;
      let { id = '' } = query;
      id = id.length === 20 ? id : '';
      if (id) {
        _data.read('tokens', id, (readErr:string, tokenData:any) => {
          if (!readErr && tokenData) {
            if (Date.now() < tokenData.expires) callback(200, tokenData);
            else callback(400, { Error: 'Token has expired' });
          } else {
            callback(404);
          }
        });
      } else {
        callback(400, { Error: 'Missing required id.' });
      }
    },
    delete: (data:any, callback:any) => {
      // check the id is valid
      const { query = {} } = data;
      let { id = '' } = query;
      id = id.length === 20 ? id : '';
      if (id) {
        _data.read('tokens', id, (readErr:string, tokenData:any) => {
          if (!readErr && tokenData) {
            _data.delete('tokens', id, (deleteErr:any) => {
              if (!deleteErr) callback(200, { id: tokenData.id });
              else {
                callback(500, { Error: 'Couldn;t delete token' });
              }
            });
          } else {
            callback(404);
          }
        });
      } else {
        callback(400, { Error: 'Missing required token id.', data });
      }
    },
    verifyToken: (id:string, phone:string, callback:any) => {
      // check the id is valid
      _data.read('tokens', id, (readErr:string, tokenData:any) => {
        if (!readErr && tokenData) {
          if (tokenData.phone === phone && tokenData.expires > Date.now()) {
            callback(true);
          } else {
            callback(false);
          }
        } else {
          callback(false);
        }
      });
    },
  },
  tokens: (data:any, callback:any) => {
    const acceptableMethods = ['post', 'put', 'get', 'delete'];
    if (acceptableMethods.indexOf(data.method) !== -1) {
      // eslint-disable-next-line no-underscore-dangle
      handlers._tokens[data.method](data, callback);
    } else {
      callback(405);
    }
  },
  _checks: {
    // Required data: firstName, lastName, phone, password, tosAgreement
    post: (data: any = {}, callback: any) => {
      const { payload } = data;
      let { method } = payload;
      if (!defaultMethods.includes(method.toUpperCase())) {
        callback(400); return;
      }
      const protocol = typeof (data.payload.protocol) === 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
      const url = typeof (data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
      method = typeof (data.payload.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
      const successCodes = typeof (data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
      const timeoutSeconds = typeof (data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
      if (protocol && url && method && successCodes && timeoutSeconds) {
        // Make sure the user doesn't exist
        const { headers: { token = '' } = {} } = data;
        _data.read('tokens', token, (err:boolean, tokenData:any) => {
          if (!err && tokenData) {
            // lookup the user
            const { phone } = tokenData;

            _data.read('users', phone, (userReadErr:boolean, userData:any) => {
              if (!userReadErr && userData) {
                const { checks } = userData;
                const userChecks = typeof (checks) === 'object' && checks instanceof Array ? checks : [];
                // make sure the max checks limit is not surpassed
                if (userChecks.length < maxChecks) {
                  const checkId = nanoid(20);
                  const checkObject = {
                    id: checkId,
                    phone,
                    url,
                    method,
                    successCodes,
                    protocol,
                    timeoutSeconds,
                  };
                  _data.create('checks', checkId, checkObject, (writeCheckErr: boolean) => {
                    if (!writeCheckErr) {
                      const updatedUserData = {
                        ...userData,
                        checks: [...userChecks, checkObject.id],
                      };
                      _data.update('users', phone, updatedUserData, (updateUserDataErr: boolean) => {
                        if (!updateUserDataErr) {
                          console.log(updatedUserData);
                          callback(200, checkObject);
                        } else {
                          callback(500, { Error: 'Could not update the attached user data to the check' });
                          _data.delete('checks', checkId, () => {

                          });
                        }
                      });
                    } else {
                      callback(500, { Error: 'Could not create a new check' });
                    }
                  });
                } else {
                  callback(403, { Error: `The User has exceeded the max no of checks ${maxChecks}` });
                }
              } else {
                callback(403, { Error: 'Invalid token', userData, token });
              }
            });
          } else {
            callback(403, { Error: 'Missing token' });
          }
        });
      } else {
        callback(400, { Error: 'Missing required inupts or inputs are invalid' });
      }
    },
    // Required: phone
    // optional : anyone of the data
    //  @TODO: only let autheticated users access their objects not anyone else's

    put: (data:any, callback:any) => {
      // validations
      const { payload = {} } = data;
      let {
        firstName = '', lastName = '', phone = '', tosAgreement = true,
      } = payload;
      const { password } = payload;
      firstName = firstName.trim();
      lastName = lastName.trim();
      phone = phone.trim();
      phone = phone.length === 10 ? phone : '';
      tosAgreement = !!tosAgreement;

      if (phone && tosAgreement && (firstName || lastName || password)) {
        // Make sure the user doesn't exist
        const { headers: { token = '' } = {} } = data;
        handlers._tokens.verifyToken(token, phone, (tokenIsValid:boolean) => {
          if (tokenIsValid) {
            _data.read('users', phone, (err:string, userData:any) => {
              if (!err && userData) {
                // hash the password
                const { firstName: storedFirstName, lastName: storedLastName } = userData;

                let { hashedPassword } = userData;
                hashedPassword = password ? Hash(password) : hashedPassword;
                firstName = firstName || storedFirstName;
                lastName = lastName || storedLastName;
                if (hashedPassword) {
                  const userObject = {
                    firstName,
                    lastName,
                    phone,
                    hashedPassword,
                    tosAgreement: true,
                  };
                  _data.update('users', phone, userObject, (createErr:string) => {
                    if (!createErr) {
                      callback(204);
                    } else {
                      callback(500, { Error: 'Could Not create user', createErr });
                    }
                  });
                } else {
                  callback(500, { Error: 'Could not hash the password' });
                }
              } else {
                // User already exist
                callback(400, { Error: 'The user with that phone does not exist' });
              }
            });
          } else {
            callback(403, { Error: 'Missing token' });
          }
        });
      } else {
        callback(400, { Error: 'Missing required fields' });
      }
    },

    get: (data:any, callback:any) => {
      // check the phone no is valid
      const { query = {} } = data;
      let { phone = '' } = query;
      phone = phone.length === 10 ? phone : '';
      if (phone) {
        const { headers: { token = '' } = {} } = data;
        handlers._tokens.verifyToken(token, phone, (tokenIsValid:boolean) => {
          if (tokenIsValid) {
            _data.read('users', phone, (readErr:string, userData:any) => {
              if (!readErr && userData) {
                const foundData = { ...userData, hashedPassword: undefined };
                callback(200, foundData);
              } else {
                callback(404);
              }
            });
          } else {
            callback(403, { Error: 'Missing token' });
          }
        });
      } else {
        callback(400, { Error: 'Missing required phone no.', data });
      }
    },
    delete: (data:any, callback:any) => {
      // check the phone no is valid
      const { query = {} } = data;
      let { phone = '' } = query;
      phone = phone.length === 10 ? phone : '';
      if (phone) {
        const { headers: { token = '' } = {} } = data;
        handlers._tokens.verifyToken(token, phone, (tokenIsValid:boolean) => {
          if (tokenIsValid) {
            _data.read('users', phone, (readErr:string, userData:any) => {
              if (!readErr && userData) {
                _data.delete('users', phone, (deleteErr:any) => {
                  if (!deleteErr) callback(200, { phone: userData.phone });
                  else {
                    callback(500, { Error: 'Couldn;t delete user' });
                  }
                });
              } else {
                callback(404);
              }
            });
          } else {
            callback(403, { Error: 'Missing token' });
          }
        });
      } else {
        callback(400, { Error: 'Missing required phone no.', data });
      }
    },
  },
  checks: (data:any, callback:any) => {
    const acceptableMethods = ['post', 'put', 'get', 'delete'];
    if (acceptableMethods.indexOf(data.method) !== -1) {
      // eslint-disable-next-line no-underscore-dangle
      handlers._checks[data.method](data, callback);
    } else {
      callback(405);
    }
  },
};

export default handlers;
