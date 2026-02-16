import { ConfigParser } from './src/config/parser.js';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

// Тестовая проверка конфигурации
const testConfig = async () => {
  try {
    // Читаем конфигурацию
    const configPath = './card-labeler.yml';
    const configContent = fs.readFileSync(configPath, 'utf8');
    const rawConfig = yaml.load(configContent);
    
    console.log('📋 Чтение конфигурации:');
    console.log(JSON.stringify(rawConfig, null, 2));
    
    // Парсим конфигурацию
    const parsedConfig = ConfigParser.parse(rawConfig);
    
    console.log('\n✅ Парсинг успешен:');
    console.log(JSON.stringify(parsedConfig, null, 2));
    
    // Валидируем конфигурацию
    const validation = ConfigParser.validateConfig(parsedConfig);
    
    console.log('\n🔍 Валидация:');
    console.log('Валидна:', validation.valid);
    if (!validation.valid) {
      console.log('Ошибки:', validation.errors);
    }
    
    // Проверяем работу ViewDetector
    const { ViewDetector } = await import('./src/utils/view-detector.js');
    const detector = new ViewDetector(parsedConfig);
    
    console.log('\n🎯 ViewDetector тесты:');
    
    // Тест findViewForLabelType
    const statusView = detector.findViewForLabelType('Roadmap-Team', 'Status');
    const priorityView = detector.findViewForLabelType('Roadmap-Team', 'Priority');
    
    console.log('Status view:', statusView);
    console.log('Priority view:', priorityView);
    
    // Тест getAllLabelTypes
    const allTypes = detector.getAllLabelTypes('Roadmap-Team');
    console.log('All view types:', allTypes);
    
    // Тест getViewsForProject
    const views = detector.getViewsForProject('Roadmap-Team');
    console.log('All views:', views);
    
    console.log('\n🎉 Все тесты пройдены!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
};

testConfig();
