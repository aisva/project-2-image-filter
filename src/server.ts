import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles, isUrl} from './util/util';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file
  app.get("/filteredimage/", async (req: Request, res: Response) => {
    // Accesses the image_url query
    let { image_url }: { image_url: string } = req.query;

    // Validates the image_url query
    if (image_url == null) {
      return res.status(400)
        .send("An image URL is required");
    }
    if (!isUrl(image_url)) {
      return res.status(400)
        .send("Provided URL is not valid");
    }

    // Filters the image, sends the resulting file in the response and deletes it from the server
    let filteredImage: string = null;
    try {
      filteredImage = await filterImageFromURL(image_url);
      return res.status(200)
        .sendFile(filteredImage, (error: Error) => {
          deleteLocalFiles([filteredImage]);
          if (error != null) {
            return res.status(500)
              .send(`System internal error: ${error.message}`);
          }
        });
    } catch (error) {
      if (filteredImage != null) {
        deleteLocalFiles([filteredImage]);
      }
      return res.status(500)
        .send(`System internal error: ${error.message}`);
    }
  });

  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();