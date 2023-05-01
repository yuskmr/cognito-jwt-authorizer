import { CognitoJwtVerifier } from "aws-jwt-verify";

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: "<cognito user pool id>",
  tokenUse: "access",  // access or id
  clientId: "<cognito client id>",
  scope: "<oauth2 scope>",
});

// Set API permissions per Cognito user group
const apiPermissions = [
  {
    cognitoUserGroup: 'users',
    resources: [
      'arn:aws:execute-api:us-east-1:123456789012:xxxxxxxxxx/*/GET/pets'
    ]
  },
  {
    cognitoUserGroup: 'admin',
    resources: [
        'arn:aws:execute-api:us-east-1:123456789012:xxxxxxxxxx/*/GET/pets',
        'arn:aws:execute-api:us-east-1:123456789012:xxxxxxxxxx/*/POST/pets'
      ]
  }
];

const getPolicyDocument = (effect, resource) => {
  const policyDocument = {
      Version: '2012-10-17',
      Statement: [{
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
      }]
  };
  return policyDocument;
}

export const handler = async (event) => {
  if (!event.type || event.type !== 'TOKEN') {
    throw new Error('Lambda Event Payload type must be "TOKEN"');
  }
  const token = event.authorizationToken;
  const accessToken = token.match(/^Bearer (.*)$/);
  if (!accessToken || accessToken.length < 2) {
      throw new Error(`Invalid Authorization token"`);
  }

  let payload;
  try {
    // If the token is not valid, an error is thrown:
    payload = await jwtVerifier.verify(accessToken[1]);
  } catch {
    // API Gateway wants this *exact* error message, otherwise it returns 500 instead of 401:
    throw new Error('Unauthorized');
  }

  if (!payload['cognito:groups'] || payload['cognito:groups'].length === 0) {
    throw new Error('Unauthorized');
  }
  
  let allowedResources = [];
  payload['cognito:groups'].forEach(userGroup => {
    const permission = apiPermissions.find(perm => perm.cognitoUserGroup === userGroup);
    if (permission) {
      allowedResources = allowedResources.concat(persmission.resources);
    }
  });

  return {
    principalId: payload.sub,
    policyDocument: 
      (allowedResources.length > 0) ? getPolicyDocument('Allow', allowedResources) : getPolicyDocument('Deny', event.methodArn),
  }
};