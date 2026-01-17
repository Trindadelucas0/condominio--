// Test Runner - Executa todos os testes do sistema
// Mostra logs detalhados de cada teste

const fs = require('fs');
const path = require('path');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.totalTime = 0;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async runAll() {
    this.log('\n╔══════════════════════════════════════════════════════════════╗', 'cyan');
    this.log('║     SISTEMA DE TESTES - GESTÃO CONDOMINIAL                  ║', 'cyan');
    this.log('╚══════════════════════════════════════════════════════════════╝\n', 'cyan');

    const testFiles = [
      '01-auth.test.js',
      '02-financeiro.test.js',
      '03-inadimplencia.test.js',
      '04-assembleias.test.js',
      '05-fundo-reserva.test.js',
      '06-relatorios.test.js',
      '07-dashboards.test.js',
      '08-permissoes.test.js',
      '09-fluxos-completos.test.js',
      '10-testes-operacionais.test.js',
      '11-testes-financeiro-operacional.test.js',
      '13-performance.test.js'
    ];

    for (const file of testFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        this.log(`\n${'='.repeat(60)}`, 'blue');
        this.log(`Executando: ${file}`, 'bright');
        this.log('='.repeat(60), 'blue');
        
        try {
          const testModule = require(filePath);
          if (typeof testModule.run === 'function') {
            await testModule.run(this);
          } else {
            this.log(`⚠️  Arquivo ${file} não exporta função run()`, 'yellow');
          }
        } catch (error) {
          this.log(`❌ Erro ao executar ${file}: ${error.message}`, 'red');
          console.error(error);
          this.failed++;
        }
      } else {
        this.log(`⚠️  Arquivo ${file} não encontrado`, 'yellow');
      }
    }

    this.printSummary();
  }

  printSummary() {
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('RESUMO DOS TESTES', 'bright');
    this.log('='.repeat(60), 'cyan');
    this.log(`✅ Testes Passados: ${this.passed}`, 'green');
    this.log(`❌ Testes Falhados: ${this.failed}`, 'red');
    this.log(`⏱️  Tempo Total: ${(this.totalTime / 1000).toFixed(2)}s`, 'blue');
    this.log('='.repeat(60) + '\n', 'cyan');
  }

  async test(name, testFn) {
    const startTime = Date.now();
    this.log(`\n🧪 Teste: ${name}`, 'bright');
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.totalTime += duration;
      this.passed++;
      this.log(`   ✅ PASSOU (${duration}ms)`, 'green');
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.totalTime += duration;
      this.failed++;
      this.log(`   ❌ FALHOU (${duration}ms)`, 'red');
      this.log(`   Erro: ${error.message}`, 'red');
      if (error.stack) {
        this.log(`   Stack: ${error.stack.split('\n')[1]}`, 'gray');
      }
      return false;
    }
  }

  logDetail(message) {
    this.log(`   📝 ${message}`, 'gray');
  }

  logSuccess(message) {
    this.log(`   ✅ ${message}`, 'green');
  }

  logError(message) {
    this.log(`   ❌ ${message}`, 'red');
  }

  logWarning(message) {
    this.log(`   ⚠️  ${message}`, 'yellow');
  }

  logInfo(message) {
    this.log(`   ℹ️  ${message}`, 'blue');
  }
}

// Executa testes se chamado diretamente
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAll().then(() => {
    process.exit(runner.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;
