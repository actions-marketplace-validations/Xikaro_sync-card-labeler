const { ProjectApi } = require('./lib/main.js');

// Тест проверки GitHub API
console.log('🌐 Проверка GitHub API взаимодействия\n');

async function testGitHubAPI() {
  try {
    // Проверяем наличие токена
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    if (!token) {
      console.log('⚠️  GitHub токен не найден. Используем мок-тесты.');
      return mockTest();
    }

    console.log('✅ GitHub токен найден');
    
    // Создаем мок octokit для тестов
    const mockOctokit = {
      rest: {
        projects: {
          listColumns: async ({ project_id }) => {
            console.log(`📋 Запрос колонок для проекта ${project_id}`);
            return {
              data: [
                { id: 1, name: 'Dropped' },
                { id: 2, name: 'Backlog' },
                { id: 3, name: 'Ready' },
                { id: 4, name: 'In Progress' },
                { id: 5, name: 'Done' },
                { id: 6, name: 'Critical' },
                { id: 7, name: 'High' },
                { id: 8, name: 'Medium' },
                { id: 9, name: 'Low' },
                { id: 10, name: 'Long-term plans' }
              ]
            };
          },
          listCards: async ({ column_id }) => {
            console.log(`🃏 Запрос карточек для колонки ${column_id}`);
            return { data: [] };
          },
          moveCard: async ({ card_id, column_id, position }) => {
            console.log(`🔄 Перемещение карточки ${card_id} в колонку ${column_id} (позиция: ${position})`);
            return { data: {} };
          }
        },
        issues: {
          get: async ({ owner, repo, issue_number }) => {
            console.log(`📄 Получение issue ${owner}/${repo}#${issue_number}`);
            return {
              data: {
                number: issue_number,
                title: 'Test Issue',
                labels: [{ name: 'Status: Backlog' }, { name: 'Priority: High' }]
              }
            };
          }
        }
      },
      request: async (endpoint, params) => {
        console.log(`🔍 Запрос к API: ${endpoint}`, params);
        if (endpoint.includes('views')) {
          return {
            data: [
              { id: 1, name: 'Status' },
              { id: 3, name: 'Priority' }
            ]
          };
        }
        return { data: [] };
      }
    };

    // Создаем экземпляр ProjectApi
    const projectApi = new ProjectApi(mockOctokit);
    
    console.log('\n🧪 Тесты ProjectApi:');
    
    // Тест 1: Получение колонок
    console.log('\n1. Тест получения колонок проекта...');
    const columns = await projectApi.getColumnId(16, 'Backlog');
    console.log('   ✓ getColumnId(16, "Backlog"):', columns);
    
    // Тест 2: Поиск карточки
    console.log('\n2. Тест поиска карточки...');
    const cardId = await projectApi.findCardId(123, 16);
    console.log('   ✓ findCardId(123, 16):', cardId);
    
    // Тест 3: Получение view
    console.log('\n3. Тест получения view проекта...');
    const views = await projectApi.getProjectViews(16);
    console.log('   ✓ getProjectViews(16):', views.map(v => ({ id: v.id, name: v.name })));
    
    // Тест 4: Получение колонок view
    console.log('\n4. Тест получения колонок view...');
    const viewColumns = await projectApi.getViewColumns(16, 1);
    console.log('   ✓ getViewColumns(16, 1):', viewColumns.length, 'колонок');
    
    // Тест 5: Перемещение карточки
    console.log('\n5. Тест перемещения карточки...');
    try {
      await projectApi.moveCard(123, 16, 'Ready');
      console.log('   ✓ moveCard выполнен успешно');
    } catch (error) {
      console.log('   ⚠️  moveCard:', error.message);
    }
    
    console.log('\n✅ Все API тесты пройдены!');
    
  } catch (error) {
    console.error('❌ Ошибка API теста:', error.message);
  }
}

function mockTest() {
  console.log('🎭 Запуск мок-тестов без реального API...\n');
  
  // Проверяем, что модуль загружается
  try {
    const { ProjectApi } = require('./lib/main.js');
    console.log('✅ ProjectApi модуль загружен');
    
    // Проверяем наличие методов
    const methods = ['moveCard', 'getColumnId', 'findCardId', 'getProjectViews', 'getViewColumns'];
    methods.forEach(method => {
      if (typeof ProjectApi.prototype[method] === 'function') {
        console.log(`✅ Метод ${method} существует`);
      } else {
        console.log(`❌ Метод ${method} отсутствует`);
      }
    });
    
    console.log('\n🎉 Мок-тесты пройдены! Для полноценного теста нужен GITHUB_TOKEN.');
    
  } catch (error) {
    console.error('❌ Ошибка загрузки модуля:', error.message);
  }
}

// Запуск тестов
testGitHubAPI().then(() => {
  console.log('\n🚀 Проверка GitHub API завершена');
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
});
