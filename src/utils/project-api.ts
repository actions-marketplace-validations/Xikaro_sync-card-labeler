import type { Octokit } from '@technote-space/github-action-helper/dist/types';

export class ProjectApi {
  constructor(
    private octokit: Octokit
  ) {}

  async moveCard(issueNumber: number, projectId: number, columnName: string): Promise<void> {
    try {
      // Получаем ID колонки по имени
      const columnId = await this.getColumnId(projectId, columnName);
      if (!columnId) {
        throw new Error(`Column "${columnName}" not found in project ${projectId}`);
      }

      // Находим карточку для issue
      const cardId = await this.findCardId(issueNumber, projectId);
      if (!cardId) {
        throw new Error(`Card for issue ${issueNumber} not found in project ${projectId}`);
      }

      // Перемещаем карточку
      await this.octokit.rest.projects.moveCard({
        card_id: cardId,
        position: 'top',
        column_id: columnId
      });
    } catch (error) {
      console.error('Error moving card:', error);
      throw error;
    }
  }

  async getColumnId(projectId: number, columnName: string): Promise<number | null> {
    try {
      const columns = await this.octokit.rest.projects.listColumns({
        project_id: projectId
      });

      const column = columns.data.find(col => col.name === columnName);
      return column ? column.id : null;
    } catch (error) {
      console.error('Error getting column ID:', error);
      return null;
    }
  }

  async findCardId(issueNumber: number, projectId: number): Promise<number | null> {
    try {
      const columns = await this.octokit.rest.projects.listColumns({
        project_id: projectId
      });

      for (const column of columns.data) {
        const cards = await this.octokit.rest.projects.listCards({
          column_id: column.id
        });

        const card = cards.data.find(card => {
          if (!card.content_url) return false;
          return card.content_url.includes(`/issues/${issueNumber}`);
        });

        if (card) {
          return card.id;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding card ID:', error);
      return null;
    }
  }

  async getProjectViews(projectId: number): Promise<any[]> {
    try {
      // GitHub Projects API v2 для получения view
      const response = await this.octokit.request('GET /projects/{project_id}/views', {
        project_id: projectId
      });
      return response.data;
    } catch (error) {
      console.error('Error getting project views:', error);
      return [];
    }
  }

  async getViewColumns(projectId: number, viewId: number): Promise<any[]> {
    try {
      const response = await this.octokit.request('GET /projects/{project_id}/views/{view_id}/columns', {
        project_id: projectId,
        view_id: viewId
      });
      return response.data;
    } catch (error) {
      console.error('Error getting view columns:', error);
      return [];
    }
  }

  async getViewByName(projectId: number, viewNameOrId: string | number): Promise<any | null> {
    try {
      // Сначала пробуем найти по имени
      const views = await this.getProjectViews(projectId);
      const viewByName = views.find(view => view.name === viewNameOrId);
      if (viewByName) {
        return viewByName;
      }
      
      // Если не нашли по имени, пробуем по ID
      const viewId = parseInt(viewNameOrId.toString());
      if (!isNaN(viewId)) {
        const viewById = views.find(view => view.id === viewId);
        return viewById || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting view by name/ID:', error);
      return null;
    }
  }
}
