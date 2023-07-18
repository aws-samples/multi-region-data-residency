import crypto from 'crypto';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';


export async function handleEvent(event: any) {
    console.log('Pre Auth Handler - Received event ', event);

    // Get the AWS Region of this Lambda
    const region = event.region;

    // Hash user email string
    const email = event.request.userAttributes.email;
    const emailHash = crypto.createHash('md5').update(email).digest("hex");

    // Get DynamoDB record in UserResidency table based on emailHash
    const dynamoDBClient = new DynamoDBClient({ region });
    const userResidencyTable = process.env.USER_RESIDENCY_TABLE;
    const userResidencyItem = await dynamoDBClient.send(new GetItemCommand({
        TableName: userResidencyTable,
        Key: {
            userId: { S: emailHash }
        }
    }));

    console.log(userResidencyItem);

    if ( userResidencyItem && userResidencyItem.Item?.region != region ) {
        throw new Error("You account is not associated with this region. Please ensure that you are in the correct region.");
    }

    return event;
}