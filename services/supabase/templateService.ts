import { supabase } from '../../lib/supabaseClient';

// Template type for diploma templates
export interface DiplomaTemplate {
    id: string;
    school_id: string;
    name: string;
    layout: 'landscape' | 'portrait';
    width: number;
    height: number;
    elements: TemplateElement[];
    created_at?: string;
    updated_at?: string;
}

export interface TemplateElement {
    id: string;
    type: 'text' | 'variable' | 'image';
    label: string;
    content: string;
    x: number;
    y: number;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
}

export const templateService = {
    /**
     * Get all templates for a school
     */
    async getTemplates(schoolId: string): Promise<DiplomaTemplate[]> {
        const { data, error } = await supabase
            .from('diploma_templates')
            .select('*')
            .eq('school_id', schoolId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching templates:', error);
            // If table doesn't exist, return empty array
            if (error.code === '42P01') {
                console.warn('diploma_templates table does not exist. Using fallback.');
                return [];
            }
            throw error;
        }

        return data || [];
    },

    /**
     * Get template by ID
     */
    async getTemplateById(templateId: string): Promise<DiplomaTemplate | null> {
        const { data, error } = await supabase
            .from('diploma_templates')
            .select('*')
            .eq('id', templateId)
            .single();

        if (error) {
            console.error('Error fetching template:', error);
            return null;
        }

        return data;
    },

    /**
     * Create new template
     */
    async createTemplate(template: Omit<DiplomaTemplate, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('diploma_templates')
            .insert([template])
            .select()
            .single();

        if (error) {
            console.error('Error creating template:', error);
            throw error;
        }

        return data;
    },

    /**
     * Update existing template
     */
    async updateTemplate(templateId: string, updates: Partial<DiplomaTemplate>) {
        const { data, error } = await supabase
            .from('diploma_templates')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', templateId)
            .select()
            .single();

        if (error) {
            console.error('Error updating template:', error);
            throw error;
        }

        return data;
    },

    /**
     * Delete template
     */
    async deleteTemplate(templateId: string) {
        const { error } = await supabase
            .from('diploma_templates')
            .delete()
            .eq('id', templateId);

        if (error) {
            console.error('Error deleting template:', error);
            throw error;
        }
    },

    /**
     * Save template (create or update)
     */
    async saveTemplate(template: DiplomaTemplate) {
        if (template.id && template.created_at) {
            // Update existing
            return await this.updateTemplate(template.id, template);
        } else {
            // Create new
            const { id, created_at, updated_at, ...templateData } = template;
            return await this.createTemplate(templateData);
        }
    },
};
