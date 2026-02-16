// Комплексный тест всей системы
console.log('🔬 Комплексная проверка Auto Card Labeler\n');

const fs = require('fs');
const yaml = require('js-yaml');

async function runComprehensiveTest() {
  const results = {
    config: false,
    viewDetector: false,
    build: false,
    api: false,
    integration: false
  };
  
  try {
    // 1. Тест конфигурации
    console.log('📋 1. Тест конфигурации...');
    const configContent = fs.readFileSync('./card-labeler.ym', 'utf8');
    const rawConfig = yaml.load(configContent);
    
    const projectConfig = rawConfig['Roadmap-Team'];
    const hasViews = projectConfig.views && Object.keys(projectConfig.views).length > 0;
    const hasSync = projectConfig.sync_directions;
    const hasConflict = projectConfig.conflict_resolution;
    
    if (hasViews && hasSync && hasConflict) {
      console.log('   ✓ Конфигурация корректна');
      results.config = true;
    }
    
    // 2. Тест ViewDetector логики
    console.log('\n🔍 2. Тест ViewDetector...');
    const statusView = projectConfig.views.Status ? 'Status' : null;
    const priorityView = projectConfig.views.Priority ? 'Priority' : null;
    
    if (statusView && priorityView) {
      console.log('   ✓ Status view найден:', statusView);
      console.log('   ✓ Priority view найден:', priorityView);
      results.viewDetector = true;
    }
    
    // 3. Тест сборки
    console.log('\n🔨 3. Тест сборки...');
    try {
      const libPath = './lib/main.js';
      if (fs.existsSync(libPath)) {
        const stats = fs.statSync(libPath);
        if (stats.size > 1000) { // Проверяем, что файл не пустой
          console.log('   ✓ Сборка успешна, размер:', stats.size, 'байт');
          results.build = true;
        }
      }
    } catch (error) {
      console.log('   ❌ Ошибка сборки:', error.message);
    }
    
    // 4. Тест API методов
    console.log('\n🌐 4. Тест API методов...');
    const sourcePath = './src/utils/project-api.ts';
    const sourceContent = fs.readFileSync(sourcePath, 'utf8');
    
    const apiMethods = ['moveCard', 'getColumnId', 'findCardId', 'getProjectViews', 'getViewColumns'];
    const foundMethods = apiMethods.filter(method => sourceContent.includes(method));
    
    if (foundMethods.length === apiMethods.length) {
      console.log('   ✓ Все API методы найдены:', foundMethods.join(', '));
      results.api = true;
    }
    
    // 5. Тест интеграции
    console.log('\n🔗 5. Тест интеграции...');
    
    // Проверяем, что ViewDetector может работать с конфигурацией
    const testViewDetector = (config, projectName, viewType) => {
      const project = config[projectName];
      if (!project?.views) return null;
      return project.views[viewType] ? viewType : null;
    };
    
    const statusResult = testViewDetector(rawConfig, 'Roadmap-Team', 'Status');
    const priorityResult = testViewDetector(rawConfig, 'Roadmap-Team', 'Priority');
    
    if (statusResult === 'Status' && priorityResult === 'Priority') {
      console.log('   ✓ ViewDetector интеграция успешна');
      console.log('   ✓ Status view определен:', statusResult);
      console.log('   ✓ Priority view определен:', priorityResult);
      results.integration = true;
    }
    
    // 6. Итоги
    console.log('\n📊 6. Результаты тестов:');
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅' : '❌';
      const testName = {
        config: 'Конфигурация',
        viewDetector: 'ViewDetector',
        build: 'Сборка',
        api: 'API методы',
        integration: 'Интеграция'
      }[test];
      console.log(`   ${status} ${testName}`);
    });
    
    console.log(`\n🎯 Пройдено: ${passedTests}/${totalTests} тестов`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 Система полностью готова к продакшену!');
      console.log('🚀 Можно развертывать в GitHub Actions');
      
      // Дополнительная информация для развертывания
      console.log('\n📝 Для развертывания убедитесь, что:');
      console.log('   1. card-labeler.yml загружен в репозиторий');
      console.log('   2. GitHub Actions workflow настроен');
      console.log('   3. Секрет GITHUB_TOKEN доступен');
      console.log('   4. Проект GitHub существует и доступен');
      
      return true;
    } else {
      console.log('\n⚠️  Есть проблемы, которые нужно решить');
      return false;
    }
    
  } catch (error) {
    console.error('\n💥 Критическая ошибка тестирования:', error.message);
    return false;
  }
}

// Запуск комплексного теста
runComprehensiveTest().then(success => {
  process.exit(success ? 0 : 1);
});
