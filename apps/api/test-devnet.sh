#!/bin/bash

echo "🧪 Testing Ghost API Devnet Integration"
echo "========================================"
echo ""

API_URL="http://localhost:4500"

echo "1️⃣ Testing Health Endpoint..."
curl -s $API_URL/health | jq '.'
echo ""

echo "2️⃣ Testing Username Registration (Blockchain)..."
curl -s -X POST $API_URL/api/users/username \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "walletAddress": "CggC3piCmwfic1PZC6HiZpwBcJejXMVQ2T383dL2i27M"
  }' | jq '.'
echo ""

echo "3️⃣ Checking Username Availability..."
curl -s "$API_URL/api/users/username/testuser/available" | jq '.'
echo ""

echo "4️⃣ Getting Username Info..."
curl -s "$API_URL/api/users/username/testuser" | jq '.'
echo ""

echo "✅ Test complete!"
