import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>VK Authentication</title>
        <script>
          
          if (window.opener) {
            
            window.opener.postMessage({
              type: 'vk-auth-callback',
              hash: window.location.hash
            }, window.location.origin);
            window.close();
          } else {
            
            window.location.href = '/';
          }
        </script>
      </head>
      <body>
        <p>Completing authentication...</p>
      </body>
    </html>
  `);
}
