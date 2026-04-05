"use client";

import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

export type PermissionAction = 'read' | 'edit' | 'suggest' | 'manage' | 'create' | 'delete' | 'view_dashboard';
export type PermissionResource = 'student_plan' | 'space_content' | 'school_settings' | 'student_progress' | 'admin_tools' | 'teacher_tools' | 'all';

interface CanProps {
  I: PermissionAction;
  a: PermissionResource;
  scopeId?: string; // e.g., the ID of the current space or class being viewed
  children: ReactNode;
  fallback?: ReactNode;
}

export const Can = ({ I, a, scopeId, children, fallback = null }: CanProps) => {
  const { roleAssignments, loading } = useAuth();

  if (loading) return null;

  const hasPermission = () => {
    // 1. App Developer (Super Admin) Override - Has access to everything globally
    if (roleAssignments.some(ra => ra.role === 'app_developer')) return true;

    // 2. School Admin Logic
    const isSchoolAdmin = roleAssignments.find(ra => ra.role === 'school_admin');
    if (isSchoolAdmin) {
      if (a === 'admin_tools' && I === 'view_dashboard') return true;
      if (I === 'read' && (a === 'student_progress' || a === 'student_plan')) return true;
      if (I === 'suggest' && a === 'space_content') return true;
      // Admins approve (manage) suggestions
      if (I === 'manage' && a === 'student_plan') return true; 
    }

    // 3. Space Admin Logic
    const isSpaceAdmin = roleAssignments.filter(ra => ra.role === 'space_admin');
    if (isSpaceAdmin.length > 0) {
      if (a === 'admin_tools' && I === 'view_dashboard') return true;
      // If a specific space scopeId is provided, verify they are admin for THAT space
      const hasScope = scopeId ? isSpaceAdmin.some(ra => ra.scope_id === scopeId) : true;
      
      if (hasScope) {
        if (I === 'edit' || I === 'create' || I === 'delete') {
          if (a === 'space_content') return true;
        }
        if (I === 'edit' || I === 'suggest') {
          if (a === 'student_plan') return true;
        }
        if (I === 'read' && a === 'student_progress') return true;
      }
    }

    // 4. Class Teacher Logic
    const isTeacher = roleAssignments.filter(ra => ra.role === 'class_teacher');
    if (isTeacher.length > 0) {
      if (a === 'teacher_tools' && I === 'view_dashboard') return true;
      const hasScope = scopeId ? isTeacher.some(ra => ra.scope_id === scopeId) : true;

      if (hasScope) {
        if (I === 'read' && a === 'student_progress') return true;
        if (I === 'suggest' && a === 'student_plan') return true;
      }
    }

    // 5. Parent Logic
    const isParent = roleAssignments.filter(ra => ra.role === 'parent');
    if (isParent.length > 0) {
      // Logic: Parents only read progress/plans for linked children (scope_id = family/child ID)
      const hasScope = scopeId ? isParent.some(ra => ra.scope_id === scopeId) : true;
      if (hasScope && I === 'read' && (a === 'student_progress' || a === 'student_plan')) {
        return true;
      }
    }

    // 6. Student Logic
    // If they are just a student, they shouldn't see 'suggest' or 'edit' buttons for plans
    const isStudent = roleAssignments.some(ra => ra.role === 'student');
    if (isStudent && I === 'read' && a === 'student_plan') {
      // Assuming they only request 'read' for themselves
      return true;
    }

    return false;
  };

  return hasPermission() ? <>{children}</> : <>{fallback}</>;
};