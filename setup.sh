#!/bin/bash

echo "🚀 Configurando Atlas Conectados no Mac..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js não encontrado!"
    print_info "Instale o Node.js: https://nodejs.org/"
    exit 1
fi

print_status "Node.js encontrado: $(node --version)"

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    print_error "npm não encontrado!"
    exit 1
fi

print_status "npm encontrado: $(npm --version)"

# Criar estrutura de pastas
print_info "Criando estrutura de pastas..."
mkdir -p atlas-conectados
cd atlas-conectados

# Criar backend
print_info "Configurando backend..."
mkdir -p backend/src/{lib,app/api,scripts}
mkdir -p backend/src/app/api/{auth,users,churches,admin,debug,health}

# Criar frontend
print_info "Configurando frontend..."
mkdir -p frontend-web/src/{app,components,contexts,lib}
mkdir -p frontend-web/src/app/{login,dashboard,users,churches,bootstrap,debug}
mkdir -p frontend-web/src/components/ui

# Criar arquivos de configuração
print_info "Criando arquivos de configuração..."

print_status "Estrutura criada com sucesso!"
print_info "Próximo passo: Copiar os arquivos do projeto"
