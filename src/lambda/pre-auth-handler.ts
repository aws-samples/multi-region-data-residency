import crypto from 'crypto';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';

export async function handleEvent(event: any) {
    console.log('Pre Auth Handler - Received event ', event);

    // Get the AWS Region of this Lambda
    const region = event.region;

    // Hash user email string
    const email = event.userName;
    const emailHash = crypto.createHash('md5').update(email).digest("hex");

    // Get DynamoDB record in UserResidency table based on emailHash
    const dynamoDBClient = new DynamoDBClient({ region });
    const userResidencyTable = process.env.USER_RESIDENCY_TABLE;
    
    const command = new QueryCommand({
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": { S: emailHash },
        },
        TableName: userResidencyTable,
      });
    
      const response = await dynamoDBClient.send(command);

      let userRegion = '';
      response.Items?.forEach((user) => {
        userRegion = user.region.S as string;
      });

    if ( response.Items && userRegion !== region  ) {
        throw new Error("You account is not associated with this region. Please login to the correct region");
    }

    return event;
}