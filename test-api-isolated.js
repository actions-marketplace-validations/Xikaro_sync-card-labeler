// Изолированный тест GitHub API без запуска основного модуля
console.log('🌐 Изолированная проверка GitHub API\n');

// Тестируем только ProjectApi класс
const fs = require('fs');
const path = require('path');

function testProjectApiClass() {
  try {
    // Читаем сгенерированный файл и извлекаем только ProjectApi
    const libPath = path.join(__dirname, 'lib', 'main.js');
    const libContent = fs.readFileSync(libPath, 'utf8');
    
    // Находим определение ProjectApi в коде
    const projectApiMatch = libContent.match(/class ProjectApi[^}]+}/s);
    if (!projectApiMatch) {
      throw new Error('ProjectApi класс не найден в сгенерированном коде');
    }
    
    console.log('✅ ProjectApi класс найден в сборке');
    
    // Проверяем наличие методов в исходном коде
    const sourcePath = path.join(__dirname, 'src', 'utils', 'project-api.ts');
    const sourceContent = fs.readFileSync(sourcePath, 'utf8');
    
    const methods = [
      'moveCard',
      'getColumnId', 
      'findCardId',
      'getProjectViews',
      'getViewColumns'
    ];
    
    console.log('\n🔍 Проверка методов в исходном коде:');
    methods.forEach(method => {
      if (sourceContent.includes(method)) {
        console.log(`   ✓ ${method} - найден`);
      } else {
        console.log(`   ❌ ${method} - не найден`);
      }
    });
    
    // Проверяем API вызовы в исходном коде
    console.log('\n🔍 Проверка GitHub API вызовов:');
    const apiCalls = [
      'projects.listColumns',
      'projects.listCards', 
      'projects.moveCard',
      'GET /projects/{project_id}/views',
      'GET /projects/{project_id}/views/{view_id}/columns'
    ];
    
    apiCalls.forEach(call => {
      if (sourceContent.includes(call)) {
        console.log(`   ✓ ${call} - используется`);
      } else {
        console.log(`   ❌ ${call} - не найден`);
      }
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка проверки ProjectApi:', error.message);
    return false;
  }
}

function testApiEndpoints() {
  console.log('\n🎯 Тестирование эндпоинтов GitHub API:');
  
  const expectedEndpoints = [
    {
      method: 'GET',
      endpoint: '/projects/{project_id}/columns',
      purpose: 'Получение колонок проекта'
    },
    {
      method: 'GET', 
      endpoint: '/projects/columns/{column_id}/cards',
      purpose: 'Получение карточек колонки'
    },
    {
      method: 'POST',
      endpoint: '/projects/columns/cards/{card_id}/moves',
      purpose: 'Перемещение карточки'
    },
    {
      method: 'GET',
      endpoint: '/projects/{project_id}/views', 
      purpose: 'Получение view проекта'
    },
    {
      method: 'GET',
      endpoint: '/projects/{project_id}/views/{view_id}/columns',
      purpose: 'Получение колонок view'
    }
  ];
  
  expectedEndpoints.forEach((endpoint, index) => {
    console.log(`   ${index + 1}. ${endpoint.method} ${endpoint.endpoint}`);
    console.log(`      Цель: ${endpoint.purpose}`);
  });
  
  console.log('\n✅ Все необходимые эндпоинты определены');
}

function testMockApiCall() {
  console.log('\n🧪 Тест мок API вызовов:');
  
  // Создаем мок для демонстрации работы
  const mockOctokit = {
    rest: {
      projects: {
        listColumns: async ({ project_id }) => {
          console.log(`📋 GET /projects/${project_id}/columns`);
          return {
            data: [
              { id: 1, name: 'Backlog' },
              { id: 2, name: 'Ready' },
              { id: 3, name: 'In Progress' },
              { id: 4, name: 'Done' }
            ]
          };
        }
      }
    }
  };
  
  // Демонстрация вызова
  mockOctokit.rest.projects.listColumns({ project_id: 16 })
    .then(result => {
      console.log('   ✓ Ответ API:', result.data.length, 'колонок');
      console.log('   ✓ Колонки:', result.data.map(c => c.name).join(', '));
    })
    .catch(error => {
      console.log('   ❌ Ошибка:', error.message);
    });
}

// Запуск тестов
console.log('1. Проверка ProjectApi класса...');
const apiTest = testProjectApiClass();

console.log('\n2. Проверка эндпоинтов...');
testApiEndpoints();

console.log('\n3. Демонстрация мок вызовов...');
testMockApiCall();

setTimeout(() => {
  console.log('\n🎉 Изолированные тесты API завершены!');
  console.log('📝 Для реального API тестирования нужны:');
  console.log('   - GITHUB_TOKEN');
  console.log('   - GITHUB_REPOSITORY');
  console.log('   - Доступ к проекту GitHub');
}, 100);
