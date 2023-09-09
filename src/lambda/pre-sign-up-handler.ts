import crypto from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export async function handleEvent(event: any) {
    console.log('Pre Auth Handler - Received event ', event);
    
    // Auto confirm user in Cognito for demo purposes
    event.response.autoConfirmUser = true;
    
    if (event.request.userAttributes.hasOwnProperty("email")) {
        event.response.autoVerifyEmail = true;

        // Get the AWS Region of this Lambda
        const region = event.region;

        // Hash user email string
        const email = event.request.userAttributes.email;
        const emailHash = crypto.createHash('md5').update(email).digest("hex");

        // Write to DynamoDB UserResidency table
        const client = new DynamoDBClient({ region });
        const docClient = DynamoDBDocumentClient.from(client);
        const dynamoDBTableName = process.env.USER_RESIDENCY_TABLE;
        const command = new PutCommand({
            TableName: dynamoDBTableName,
            Item: {
                userId: emailHash,
                region: region,
            }
        });
        const response = await docClient.send(command);
        console.log('Pre Auth Handler - Wrote user residency to DynamoDB table');
        console.log(response);
    }

    return event;
}