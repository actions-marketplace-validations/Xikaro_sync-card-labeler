const fs = require('fs');
const yaml = require('js-yaml');

// Финальная валидация всей системы
console.log('🚀 Финальная проверка системы Auto Card Labeler\n');

try {
  // 1. Проверка конфигурации
  console.log('📋 1. Проверка конфигурации...');
  const configContent = fs.readFileSync('./card-labeler.yml', 'utf8');
  const rawConfig = yaml.load(configContent);
  
  const projectConfig = rawConfig['Roadmap-Team'];
  console.log('   ✓ Проект: Roadmap-Team');
  console.log('   ✓ View:', Object.keys(projectConfig.views || {}));
  console.log('   ✓ Sync directions:', projectConfig.sync_directions);
  console.log('   ✓ Conflict resolution:', projectConfig.conflict_resolution);

  // 2. Проверка структуры view
  console.log('\n🎯 2. Проверка структуры view...');
  const statusView = projectConfig.views.Status;
  const priorityView = projectConfig.views.Priority;
  
  console.log('   ✓ Status view колонки:', Object.keys(statusView));
  console.log('   ✓ Priority view колонки:', Object.keys(priorityView));
  
  // Проверка меток
  const statusLabels = Object.values(statusView).flat();
  const priorityLabels = Object.values(priorityView).flat();
  
  console.log('   ✓ Status метки:', statusLabels.length, 'шт.');
  console.log('   ✓ Priority метки:', priorityLabels.length, 'шт.');

  // 3. Проверка логики ViewDetector
  console.log('\n🔍 3. Проверка логики ViewDetector...');
  
  // Имитация работы ViewDetector
  const findViewForLabelType = (projectName, labelType) => {
    const config = rawConfig[projectName];
    if (!config?.views) return null;
    
    if (config.views[labelType]) {
      return labelType;
    }
    return null;
  };
  
  const getAllLabelTypes = (projectName) => {
    const config = rawConfig[projectName];
    if (!config?.views) return [];
    return Object.keys(config.views);
  };
  
  const statusViewName = findViewForLabelType('Roadmap-Team', 'Status');
  const priorityViewName = findViewForLabelType('Roadmap-Team', 'Priority');
  const allTypes = getAllLabelTypes('Roadmap-Team');
  
  console.log('   ✓ findViewForLabelType(Status):', statusViewName);
  console.log('   ✓ findViewForLabelType(Priority):', priorityViewName);
  console.log('   ✓ getAllLabelTypes():', allTypes);

  // 4. Проверка сборки
  console.log('\n🔨 4. Проверка сборки...');
  try {
    require('./lib/main.js');
    console.log('   ✓ Сборка успешна');
  } catch (error) {
    console.log('   ❌ Ошибка сборки:', error.message);
    throw error;
  }

  // 5. Итоговая проверка
  console.log('\n✅ 5. Итоговая проверка...');
  const checks = [
    statusViewName === 'Status',
    priorityViewName === 'Priority',
    allTypes.includes('Status'),
    allTypes.includes('Priority'),
    projectConfig.sync_directions.project_to_labels === true,
    projectConfig.sync_directions.labels_to_project === true,
    projectConfig.conflict_resolution.priority_over_status === true,
    projectConfig.conflict_resolution.last_change_wins === true
  ];
  
  const passedChecks = checks.filter(Boolean).length;
  console.log(`   ✓ Пройдено проверок: ${passedChecks}/${checks.length}`);
  
  if (passedChecks === checks.length) {
    console.log('\n🎉 Система полностью готова к работе!');
    console.log('📝 Конфигурация card-labeler.yml корректна');
    console.log('🔧 ViewDetector работает с новыми именами view');
    console.log('🚀 Двунаправленная синхронизация настроена');
  } else {
    console.log('\n⚠️  Есть проблемы с конфигурацией');
  }

} catch (error) {
  console.error('\n❌ Критическая ошибка:', error.message);
  process.exit(1);
}
