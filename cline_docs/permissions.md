# Permission and Role System Summary

This document outlines the permission and role system implemented in the application.

## Core Concepts

The system is built around three main entities: `User`, `Role`, and `Permission`.

1.  **Permission**: Represents a specific action or capability within the application.
    *   Defined by the `Permission` model in `backend/prisma/schema.prisma`.
    *   Each permission has a unique `code` (e.g., `exam.create`, `user.manage`).
    *   Permissions are granted to `Roles`.

2.  **Role**: A collection of `Permissions` that can be assigned to `Users`.
    *   Defined by the `Role` model in `backend/prisma/schema.prisma`.
    *   Each role has a unique `slug` (e.g., `admin`, `student`, `teacher`, `superuser`).
    *   A user can be assigned multiple roles.

    **Built-in Roles:**
    *   `superuser`: This role grants all permissions within the application.
    *   `staff`: Users with this role are granted access to the administrative site.

3.  **User**: An individual user of the application.
    *   Defined by the `User` model in `backend/prisma/schema.prisma`.
    *   Users are associated with one or more `Roles`.
    *   Their permissions are derived from the roles they hold.
    *   The user object returned to the frontend now includes an `allPermissions` array, which is a flattened list of all permission `code`s granted to the user through their assigned roles. The `superuser` role automatically grants all existing permissions, so a user with the `superuser` role will have all permission codes in their `allPermissions` array.

## Data Model

The relationships between `Permission`, `Role`, and `User` are defined in `backend/prisma/schema.prisma`.
*   The `Permission` model is related to the `Role` model via a many-to-many relationship (`role_permissions`).
*   The `Role` model is related to the `User` model via a many-to-many relationship (`user_roles`).

## Permission Checking

The logic for checking user permissions on the backend is implemented in `backend/src/services/permissionService.ts`. The primary function is `hasPermission(userId: string, code: string)`. This function determines if a given user possesses a specific permission, taking into account their assigned roles and the special `superuser` role.

On the frontend, route protection is handled by `frontend/src/components/auth/ProtectedRoute.tsx`. This component now uses a `requiredPermissions` prop (an array of permission codes) instead of `requiredRole`. A user is granted access to a route if their `allPermissions` array includes at least one of the `requiredPermissions` for that route. If `requiredPermissions` is an empty array, only authentication is required.
