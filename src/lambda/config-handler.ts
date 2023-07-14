import { SSMClient } from "@aws-sdk/client-ssm";
import { GetParametersCommand } from "@aws-sdk/client-ssm";

export async function handleEvent(event: any) {
    console.log('Config handler', event);

    // Get region
    const region = process.env.AWS_REGION;
    
    // Get SSM parameter using AWS SDK v3
    const ssm = new SSMClient({
        region: region,
    });

    const ssmRequest = new GetParametersCommand({ Names: [
        'CognitoUserPoolId',
        'CognitoUserPoolClientId',
    ]});
    const ssmResponse = await ssm.send(ssmRequest);
    const parameters = ssmResponse.Parameters;

    const responseBody = {
        region,
        cognitoUserPoolId: parameters && parameters[0].Value || '', 
        cognitoUserPoolClientId: parameters && parameters[1].Value || '', 
    };
    
    const response = {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
         },
        "body": JSON.stringify(responseBody),
        "isBase64Encoded": false
    };

    return response;
}