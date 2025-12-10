"""Add admin field to user and email_config table

Revision ID: add_admin_email
Revises: fadd836fb9b1
Create Date: 2024-12-10

"""
from alembic import op
import sqlalchemy as sa
from crewlog.database import GUID


# revision identifiers, used by Alembic.
revision = 'add_admin_email'
down_revision = 'fadd836fb9b1'
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    """Check if a column exists in a table (SQLite compatible)."""
    from alembic import context
    bind = context.get_bind()
    result = bind.execute(f"PRAGMA table_info({table_name})")
    columns = [row[1] for row in result]
    return column_name in columns


def table_exists(table_name):
    """Check if a table exists (SQLite compatible)."""
    from alembic import context
    bind = context.get_bind()
    result = bind.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [table_name])
    return result.fetchone() is not None


def upgrade():
    # Add is_admin column to user table if it doesn't exist
    if not column_exists('user', 'is_admin'):
        op.add_column('user', sa.Column('is_admin', sa.Boolean(), nullable=True))
        op.execute("UPDATE \"user\" SET is_admin = false WHERE is_admin IS NULL")
    
    # Add created_at column to user table if it doesn't exist
    if not column_exists('user', 'created_at'):
        op.add_column('user', sa.Column('created_at', sa.DateTime(), nullable=True))
        op.execute("UPDATE \"user\" SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL")
    
    # Create email_config table if it doesn't exist
    if not table_exists('email_config'):
        op.create_table('email_config',
        sa.Column('id', GUID(), nullable=False),
        sa.Column('provider', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('smtp_server', sa.String(length=255), nullable=True),
        sa.Column('smtp_port', sa.Integer(), nullable=True),
        sa.Column('smtp_login', sa.String(length=255), nullable=True),
        sa.Column('smtp_password', sa.String(length=255), nullable=True),
        sa.Column('smtp_mailbox', sa.String(length=255), nullable=True),
        sa.Column('smtp_use_tls', sa.Boolean(), nullable=False),
        sa.Column('sendgrid_api_key', sa.String(length=255), nullable=True),
        sa.Column('sendgrid_from_email', sa.String(length=255), nullable=True),
        sa.Column('sendgrid_from_name', sa.String(length=255), nullable=True),
        sa.Column('smtp2go_api_key', sa.String(length=255), nullable=True),
        sa.Column('smtp2go_sender', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by_id', GUID(), nullable=True),
            sa.ForeignKeyConstraint(['created_by_id'], ['user.id'], ),
            sa.PrimaryKeyConstraint('id')
        )


def downgrade():
    # Drop email_config table
    op.drop_table('email_config')
    
    # Remove columns from user table
    op.drop_column('user', 'created_at')
    op.drop_column('user', 'is_admin')