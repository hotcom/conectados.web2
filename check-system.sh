#!/bin/bash

echo "🔍 Verificando sistema Atlas Conectados..."

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 instalado: $($1 --version | head -n1)${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 não encontrado${NC}"
        return 1
    fi
}

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1 existe${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 não encontrado${NC}"
        return 1
    fi
}

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null; then
        echo -e "${YELLOW}⚠️  Porta $1 em uso${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Porta $1 livre${NC}"
        return 0
    fi
}

echo "📋 Verificando pré-requisitos..."
check_command node
check_command npm
check_command git

echo ""
echo "🔌 Verificando portas..."
check_port 3000
check_port 3001

echo ""
echo "📁 Verificando estrutura..."
check_file "backend/package.json"
check_file "frontend-web/package.json"
check_file "backend/.env"
check_file "frontend-web/.env.local"

echo ""
echo "🔥 Verificando Firebase..."
check_file "backend/firebase-admin-key.json"

echo ""
echo "📦 Verificando node_modules..."
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✅ Backend dependencies instaladas${NC}"
else
    echo -e "${RED}❌ Backend dependencies não instaladas${NC}"
    echo -e "${YELLOW}Execute: cd backend && npm install${NC}"
fi

if [ -d "frontend-web/node_modules" ]; then
    echo -e "${GREEN}✅ Frontend dependencies instaladas${NC}"
else
    echo -e "${RED}❌ Frontend dependencies não instaladas${NC}"
    echo -e "${YELLOW}Execute: cd frontend-web && npm install${NC}"
fi

echo ""
echo "🎯 Sistema verificado!"
