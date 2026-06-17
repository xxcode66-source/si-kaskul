#!/bin/bash

# Color codes untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Sistem Informasi Desa Kasomalang Kulon - Setup Script    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo -e "${RED}❌ Node.js tidak ditemukan. Silakan install Node.js terlebih dahulu${NC}"
    echo "   Download dari: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js terdeteksi: $(node --version)${NC}"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo -e "${RED}❌ npm tidak ditemukan${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm terdeteksi: $(npm --version)${NC}"
echo ""

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend || exit
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

cd ..
echo ""

# Start the server
echo -e "${BLUE}🚀 Starting Backend Server...${NC}"
echo -e "${YELLOW}Backend akan berjalan di: http://localhost:3000${NC}"
echo -e "${YELLOW}API Documentation tersedia di endpoint /api${NC}"
echo -e "${YELLOW}Tekan Ctrl+C untuk stop server${NC}"
echo ""

cd backend || exit
npm start
