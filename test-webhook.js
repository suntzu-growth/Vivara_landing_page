
const webhookUrl = "https://script.google.com/macros/s/AKfycbwjh0E-6EF4g8albe0OkPxbM_W2WmgwOu7vLi2SmLggcnns5FSFeTI7qraXTFIs3gFe0Q/exec";

async function test() {
    console.log("--- Testing Google Sheets Webhook ---");
    console.log("URL:", webhookUrl);

    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Test Node.js",
                email: "node@test.ai",
                conversation_id: "node_test_successful"
            })
        });

        console.log("Status:", res.status);
        console.log("Status Text:", res.statusText);

        const text = await res.text();
        console.log("Response Body (first 200 chars):", text.substring(0, 200));

        if (res.ok) {
            console.log("✅ SUCCESS: The webhook responded correctly!");
        } else {
            console.log("❌ FAILED: The webhook returned an error.");
        }
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    }
}

test();
