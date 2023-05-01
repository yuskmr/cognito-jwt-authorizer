# cognito-jwt-authorizer

A simple example of a Lambda authorizer for AWS API Gateway that implements Cognito JWT token verification and RBAC using `aws-jwt-verify` library.

This function grants permissions based on the user group to which the Cognito user belongs.

## Configuration
### JWT verifier options for Cognito
Edit the JWT verifier options in `index.js` for your environment.

Example:
```
const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: "us-east-1_xxxxxxxxx",
  tokenUse: "access",
  clientId: "yyyyyyyyyyyyyy",
  scope: "api/read",
});
```

### API permissions
Edit the API permissions to be allowed for Cognito user groups. 
- `cognitoUserGroup`: Cognito user group
- `resources`: API Gateway ARNs to allow. (must be array)

For detail about API Gateway ARN format, please see [here](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-control-access-using-iam-policies-to-invoke-api.html#api-gateway-calling-api-permissions "Control access for invoking an API - Amazon API Gateway").

Example:
```
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
```

## Deployment
### Install node modules
Run `npm install` to install the dependencies. The installed dependencies are required when deploying to AWS Lambda.

### Create Bundle
Run `npm run bundle` to create a bundle file.
This will generate a cognito-jwt-authorizer.zip bundle containing all the source, configuration and node modules an AWS Lambda needs.

### Create Lambda function
From AWS Management Console:
- Runtime: `Node.js 18.x`
- Lambda function code
  - Code entry type: Update a .ZIP file
  - Function package: Upload the cognito-jwt-authorizer.zip file created earlier
- Handler: `index.handler`
- Timeout: 30 seconds

### Configure Lambda Authorizer in the API Gateway
From AWS Management Console:
- Lambda function: The function created earlier
- Lambda Event Payload: `Token`
  - Token Source: `Authorization`
  - Token Validation: `^Bearer [-0-9a-zA-Z\._]*$`
- Result TTL in seconds: 300

## References
- https://github.com/awslabs/aws-jwt-verify
- https://github.com/aws-samples/amazon-cognito-api-gateway
- https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html
