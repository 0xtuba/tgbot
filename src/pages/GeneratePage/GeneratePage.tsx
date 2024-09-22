import { type FC, useState } from 'react';
import { Input, Button } from '@telegram-apps/telegram-ui';
import * as fal from "@fal-ai/serverless-client";
import './GeneratePage.css'; // Make sure to create this CSS file

fal.config({
  credentials: "YOUR_API_KEY",
});

export type FalImage = {
  url: string;
  content_type: string;
  file_name: string;
  file_size: number;
  width: number;
  height: number;
};

export type FalResponse = {
  images: FalImage[];
  seed: number;
  has_nsfw_concepts: boolean[];
  debug_latents: null;
  debug_per_pass_latents: null;
};

export const GeneratePage: FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const response = await fal.subscribe("fal-ai/flux-lora", {
        input: {
          prompt: prompt,
          image_size: {
            width: 512,
            height: 640,
          },
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      }) as FalResponse; 
      
      if (response.images && response.images.length > 0) {
        setImageUrl(response.images[0].url);
      } else {
        setError('No image was generated');
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="generate-page">
      {imageUrl && (
        <div className="result">
          <img src={imageUrl} alt="Generated" />
        </div>
      )}
      {isLoading && (
        <div className="loading-container">
          <img src="/loading.gif" alt="Loading" className="loading-image" />
          <p>Generating image...</p>
        </div>
      )}
      <div className="input-container">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here"
          className="prompt-input"
        />
        <Button onClick={handleSubmit} disabled={isLoading} className="generate-button">
          {isLoading ? 'Generating...' : 'Generate'}
        </Button>
      </div>
      {error && (
        <div className="error">
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
