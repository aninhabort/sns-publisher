import express from "express";
import { ZodError, z } from "zod";
import { SNS } from "aws-sdk";

const app = express();

app.use(express.json());

app.post("/nfe", async (req, res) => {
  const reqBodySchema = z.object({
    url: z.string().url(),
  });

  try {
    const { url } = reqBodySchema.parse(req.body);

    const sns = new SNS({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      // secretAccessKey: process.env.AWS_ACCESS_SECRET,
      region: "us-east-1",
    });

    const { MessageId } = await sns.publish({
      Message: JSON.stringify({ url }),
      TopicArn: process.env.AWS_TOPIC_ARN,
      MessageGroupId: "01",
    }).promise()

    if (!MessageId) {
      throw Error("Fail to publish SNS message")
    }

    return res.status(201).json({ success: true })
  } catch (error: unknown) {
    console.log(error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: error.format(),
      });
    }
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

app.listen(Number(process.env.PORT), () => {
  console.log(`HTTP Server is running on port ${process.env.PORT}`);
});
