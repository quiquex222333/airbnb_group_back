import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { InvokeEndpointCommand, SageMakerRuntimeClient } from "@aws-sdk/client-sagemaker-runtime";
import type { PredictionInput } from "./model";

const sageMaker = new SageMakerRuntimeClient({});

const fields: Array<keyof PredictionInput> = [
  "price",
  "reviews_per_month",
  "calculated_host_listings_count",
  "availability_365"
];

export const predictSegment = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const raw = event.body ? JSON.parse(event.body) : {};
    const input = Object.fromEntries(fields.map((field) => [field, Number(raw[field])])) as unknown as PredictionInput;

    if (fields.some((field) => !Number.isFinite(input[field]))) {
      return response(400, "VALIDATION_ERROR", "Las cuatro variables deben ser valores numericos.");
    }
    if (input.price < 0 || input.reviews_per_month < 0 || input.calculated_host_listings_count < 1 ||
        input.availability_365 < 0 || input.availability_365 > 365) {
      return response(400, "VALIDATION_ERROR", "Los valores estan fuera de los rangos permitidos.");
    }

    const endpointName = process.env.SAGEMAKER_ENDPOINT_NAME;
    if (!endpointName) {
      throw new Error("SAGEMAKER_ENDPOINT_NAME is not configured");
    }

    const result = await sageMaker.send(new InvokeEndpointCommand({
      EndpointName: endpointName,
      ContentType: "application/json",
      Accept: "application/json",
      Body: Buffer.from(JSON.stringify(input))
    }));
    const payload = JSON.parse(new TextDecoder().decode(result.Body));
    const prediction = Array.isArray(payload) ? payload[0]?.prediction : payload?.prediction;

    if (!prediction) {
      throw new Error("SageMaker returned an invalid prediction payload");
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ prediction, input })
    };
  } catch (error) {
    console.error("ML prediction failed", error);
    if (error instanceof SyntaxError) {
      return response(400, "INVALID_JSON", "El cuerpo de la solicitud no es JSON valido.");
    }
    return response(502, "ML_INFERENCE_ERROR", "No se pudo obtener la prediccion del modelo.");
  }
};

function response(statusCode: number, code: string, message: string): APIGatewayProxyResultV2 {
  return { statusCode, headers: corsHeaders(), body: JSON.stringify({ error: { code, message } }) };
}

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": process.env.FRONTEND_URL ?? "*",
    "Access-Control-Allow-Credentials": "true"
  };
}
