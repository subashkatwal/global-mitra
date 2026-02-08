IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'GlobalMitraDB')
BEGIN
    CREATE DATABASE GlobalMitraDB;
    PRINT 'Database GlobalMitraDB created successfully';
END
ELSE
BEGIN
    PRINT 'Database GlobalMitraDB already exists';
END
GO

USE GlobalMitraDB;
GO
