# Generated by Django 5.0.4 on 2024-05-07 13:50

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Post',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('likes', models.IntegerField(default=0)),
                ('content', models.CharField(max_length=256)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_posts', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]