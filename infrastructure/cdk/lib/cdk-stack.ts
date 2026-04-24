import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const usersTable = new dynamodb.Table(this, "UsersTable", {
      partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY // solo para demo
    });

    // Lambda
    const userLambda = new lambdaNodejs.NodejsFunction(this, "UserLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: "../../services/user-service/src/handler.ts",
      handler: "createUser",
      environment: {
        USERS_TABLE: usersTable.tableName
      }
    });

    // Permisos
    usersTable.grantWriteData(userLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, "AirbnbApi", {
      restApiName: "Airbnb Service",
    });

    const users = api.root.addResource("v1").addResource("users");

    users.addMethod("POST", new apigateway.LambdaIntegration(userLambda));
  }
}