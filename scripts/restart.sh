#!/bin/bash

echo "Restarting next.js development server..."

# Kill any existing next.js development server
pkill -f "next dev"

# Start the next.js development server in the background
nohup bun run dev >log/next-dev.log 2>&1 &

# Print the PID of the new server
echo "Next.js development server restarted with PID: $!"
