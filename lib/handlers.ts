/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import _data from './data';
import { Hash, createRandomString } from './helpers';

const handlers:any = {
  ping: (data:any, callback:any) => {
    callback(200);
  },
  notFound: (_:any, callback:any) => {
    callback();
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
            callback(400, { Error: 'Missing token' });
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
            callback(400, { Error: 'Missing token' });
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
            callback(400, { Error: 'Missing token' });
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
};

export default handlers;
