const express = require('express');
const app = express();
app.use(express.json()); 

// Securely pull credentials from Render Environment
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; 
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; 
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; 

// 1. Meta Webhook Verification
app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

// 2. Receive Messages & Auto-Reply
app.post('/webhook', async (req, res) => {
    console.log("\n====== INCOMING WEBHOOK ======");
    console.log(JSON.stringify(req.body, null, 2));
    
    const body = req.body;
    if (body.object === 'whatsapp_business_account') {
        try {
            if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
                const msg = body.entry[0].changes[0].value.messages[0];
                console.log(`\nAttempting to reply to: ${msg.from}`);
                
                const response = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: msg.from,
                        type: "text",
                        text: { body: `Welcome to Foremost Tech Hub! You said: "${msg.text.body}".` }
                    })
                });
                
                const data = await response.json();
                console.log("Meta API Response:", JSON.stringify(data));
            }
        } catch (error) {
            console.error("Crash Error:", error);
        }
        res.sendStatus(200); 
    } else {
        res.sendStatus(404);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Foremost Bot is live on port ${PORT}!`));
