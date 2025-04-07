import os
import random
import sqlite3
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes, CallbackQueryHandler, MessageHandler, filters
import time
import logging
import traceback
import sys


class Bot:
    VOLUNTEER_GROUPS = {'А', 'Б', 'В'}
    GROUP_TO_CONDITION = {
        'А': 'condition1',
        'Б': 'condition2',
        'В': 'condition3'
    }
    ANIMALS = [
        "Лиса", "Волк", "Медведь", "Заяц", "Олень", "Лось", "Енот", "Барсук", 
        "Белка", "Ёж", "Рысь", "Бобр", "Выдра", "Куница", "Соболь", "Хорёк",
        "Ласка", "Росомаха", "Песец", "Бурундук"
    ]
    MAP_DOT ={
        'Акт1': 'https://yandex.ru/maps/-/CHVGFPpk',
        'Акт2': 'https://yandex.ru/maps/-/CHVGFTn4',
        'Акт3': 'https://yandex.ru/maps/-/CHVGFT~V'
    }
    MAP_DOT_NAME ={
        'Акт1': 'Главная Сцена',
        'Акт2': 'Скейт Парк',
        'Акт3': 'Малая Сцена'
    }

    def __init__(self):
        self.token = self.get_token()
        self.init_db()
        self.message_id = None

    def get_token(self):
        try:
            with open('token.txt', 'r') as file:
                return file.read().strip()
        except FileNotFoundError:
            print("Ошибка: файл token.txt не найден!")
            exit(1)

    def init_db(self):
        with sqlite3.connect('bot_database.db') as conn:
            cursor = conn.cursor()
            cursor.executescript('''
                CREATE TABLE IF NOT EXISTS Users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    telegram_id INTEGER UNIQUE NOT NULL,
                    username TEXT NOT NULL,
                    telegram_tag TEXT,
                    unique_code TEXT UNIQUE,
                    animal_code TEXT,
                    role TEXT CHECK(role IN ('Волонтёр', 'Организатор', 'Пользователь')) DEFAULT 'Пользователь',
                    full_name TEXT -- добавили запись ФИО
                );
                CREATE TABLE IF NOT EXISTS VolunteerGroups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    volunteer_group TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES Users(id)
                );
                CREATE TABLE IF NOT EXISTS SystemActions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    author_id INTEGER,
                    action TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (author_id) REFERENCES Users(id)
                );
                CREATE TABLE IF NOT EXISTS ContestLogs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    telegram_tag TEXT,
                    animal_code TEXT,
                    condition1 BOOLEAN DEFAULT FALSE,
                    condition2 BOOLEAN DEFAULT FALSE,
                    condition3 BOOLEAN DEFAULT FALSE
                );
                CREATE TABLE IF NOT EXISTS UserMainMessages (
                    telegram_id INTEGER PRIMARY KEY,
                    main_message_id INTEGER NOT NULL,
                    map_message_id INTEGER,
                    event_message_id INTEGER
                );
            ''')
            conn.commit()

    def crd_msg(self, conditions):
        links = '\n'
        for idx, condition in enumerate(conditions, start=1):
            if condition == 0:
                name = self.MAP_DOT_NAME[f'Акт{idx}']
                url = self.MAP_DOT[f'Акт{idx}']
                links += f"<b>{name}</b> {'-'*idx} <a href='{url}'>Показать</a>\n"
        
        msg = f"🗺 <b>Карта с активностями:</b>\n{links}"
        return msg

    def welc_msg(self, animal_code, unique_code):
        msg = (
            f"👋 Добро пожаловать в нашего бота!\n\n"
            f"🏷 Ваш позывной: {animal_code if animal_code else 'Не назначен'}\n"
            f"🔢 Ваш код: {unique_code if unique_code else 'Не назначен'}"
        )
        return msg

    def standardize_call_sign(self, call_sign):
        return call_sign.lower().replace("ё", "е")

    def generate_animal_code(self):
        with sqlite3.connect('bot_database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT animal_code FROM ContestLogs WHERE animal_code IS NOT NULL')
            existing_codes = {code[0] for code in cursor.fetchall() if code[0]}
            counter = 1
            while True:
                animal = random.choice(self.ANIMALS)
                new_code = f"{animal}#{counter}"
                new_code = self.standardize_call_sign(new_code)
                if new_code not in existing_codes:
                    return new_code
                counter += 1

    def get_activity_name(self, condition_field: str) -> str:
        try:
            condition_number = int(condition_field[-1])
            return self.MAP_DOT_NAME.get(f'Акт{condition_number}', f'Активность {condition_number}')
        except (ValueError, IndexError):
            return condition_field

    def generate_unique_code(self):
        return ''.join(random.choices('0123456789', k=5))

    def add_user(self, telegram_id, username, telegram_tag=None, role='Пользователь', full_name=None):
        with sqlite3.connect('bot_database.db') as conn:
            cursor = conn.cursor()
            if telegram_tag is None:
                telegram_tag = f"@{username}" if username else None
            unique_code = self.generate_unique_code()
            animal_code = self.generate_animal_code()
            cursor.execute('''
                INSERT OR IGNORE INTO Users (telegram_id, username, telegram_tag, unique_code, animal_code, role, full_name)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (telegram_id, username, telegram_tag, unique_code, animal_code, role, full_name))
            user_id = cursor.lastrowid or cursor.execute(
                'SELECT id FROM Users WHERE telegram_id = ?',
                (telegram_id,)
            ).fetchone()[0]
            
            cursor.execute('SELECT 1 FROM ContestLogs WHERE telegram_tag = ?', (telegram_tag,))
            if cursor.fetchone() is None:
                cursor.execute('''
                    INSERT INTO ContestLogs 
                    (telegram_tag, animal_code, condition1, condition2, condition3)
                    VALUES (?, ?, 0, 0, 0)
                ''', (telegram_tag, animal_code))
            
            conn.commit()
            return user_id

    def get_user_role(self, telegram_id):
        with sqlite3.connect('bot_database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT role FROM Users WHERE telegram_id = ?', (telegram_id,))
            result = cursor.fetchone()
            return result[0] if result else None

    def log_action(self, telegram_id, action):
        with sqlite3.connect('bot_database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO SystemActions (author_id, action)
                SELECT id, ? FROM Users WHERE telegram_id = ?
            ''', (action, telegram_id))
            conn.commit()
    

    def get_contest_stats(self):
        with sqlite3.connect('bot_database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id,
                       (condition1 + condition2 + condition3) as completed_conditions
                FROM ContestLogs
                ORDER BY completed_conditions DESC
                LIMIT 10
            ''')
            return cursor.fetchall()

    async def safe_edit_message(self, context, chat_id, message_id, text, reply_markup=None, parse_mode=None):
        try:
            await context.bot.edit_message_text(
                chat_id=chat_id,
                message_id=message_id,
                text=text,
                reply_markup=reply_markup,
                parse_mode=parse_mode
            )
        except Exception as e:
            if "Message is not modified" not in str(e):
                print(f"Ошибка при обновлении сообщения: {e}")

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = update.effective_user.id
        username = update.effective_user.username or "Unknown"
        telegram_tag = f"@{username}" if username else None

        self.add_user(user_id, username, telegram_tag)
        self.log_action(user_id, "Использована команда /start")
        
        with sqlite3.connect('bot_database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT cl.animal_code, u.unique_code, cl.condition1, cl.condition2, cl.condition3 
                FROM ContestLogs cl
                JOIN Users u ON u.telegram_tag = cl.telegram_tag
                WHERE u.telegram_id = ?
            ''', (user_id,))
            animal_code, unique_code, *conditions = cursor.fetchone()

        welcome_message = self.welc_msg(animal_code, unique_code)
        
        role = self.get_user_role(user_id)
        buttons = [
            [InlineKeyboardButton("О мероприятии", callback_data='get_event1')],
        ]

        if role == 'Пользователь':
            buttons.append([InlineKeyboardButton("📊 Мой статус", callback_data='show_status')])

        if sum(conditions) < 3 and role != 'Организатор' and role != 'Волонтёр':
            buttons.append([InlineKeyboardButton("Получить карту", callback_data='get_map')])
            completed_conditions = sum(conditions)
            if completed_conditions == 3:
                progress_msg = "\n🎉 Вы прошли все активности"
            else:
                progress_msg = f"\n🎈 Вы прошли {completed_conditions} из 3 активностей."
            welcome_message += progress_msg
        
        
        if role == 'Организатор':
            buttons.append([InlineKeyboardButton("Получить статистику", callback_data='get_stat')])
            buttons.append([InlineKeyboardButton("👥 Список волонтёров", callback_data='show_volunteers')])
            buttons.append([InlineKeyboardButton("Добавить волонтера", callback_data='add_volunteer')])
            buttons.append([InlineKeyboardButton("Отметить условие", callback_data='mark_condition')])
            buttons.append([InlineKeyboardButton("Отменить отметку", callback_data='unmark_condition')])
        elif role == 'Волонтёр':
            buttons.append([InlineKeyboardButton("Отметить условие", callback_data='mark_condition')])
            buttons.append([InlineKeyboardButton("Отменить отметку", callback_data='unmark_condition')])

        reply_markup = InlineKeyboardMarkup(buttons)
        message = await update.message.reply_text(welcome_message, reply_markup=reply_markup)
        
        with sqlite3.connect('bot_database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO UserMainMessages (telegram_id, main_message_id)
                VALUES (?, ?)
            ''', (user_id, message.message_id))
            conn.commit()

        try:
            await update.message.delete()
        except Exception as e:
            print(f"Ошибка при удалении сообщения с командой: {e}")

    async def handle_volunteer_search(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = update.message.from_user.id
        chat_id = update.message.chat.id
        search_query = self.standardize_call_sign(update.message.text.strip())
        main_message_id = self.get_main_message_id(user_id)

        if len(search_query) < 2:
            return

        role = self.get_user_role(user_id)
        if role != 'Волонтёр':
            return

        try:
            with sqlite3.connect('bot_database.db') as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT vg.volunteer_group 
                    FROM VolunteerGroups vg
                    JOIN Users u ON u.id = vg.user_id
                    WHERE u.telegram_id = ?
                ''', (user_id,))
                volunteer_group = cursor.fetchone()

                if not volunteer_group:
                    return
                
                volunteer_group = volunteer_group[0]
                condition_field = self.GROUP_TO_CONDITION[volunteer_group]

                cursor.execute(f'''
                    SELECT u.unique_code, u.animal_code, cl.{condition_field}, u.telegram_tag
                    FROM Users u
                    LEFT JOIN ContestLogs cl ON u.telegram_tag = cl.telegram_tag
                    WHERE LOWER(u.unique_code) LIKE ? OR LOWER(u.animal_code) LIKE ?
                    LIMIT 5
                ''', (f'%{search_query}%', f'%{search_query}%'))
                
                matches = cursor.fetchall()

            if not matches:
                buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
                reply_markup = InlineKeyboardMarkup(buttons)
                await self.safe_edit_message(
                    context,
                    chat_id,
                    main_message_id,
                    "❌ Не найдено подходящих пользователей.",
                    reply_markup
                )
                return

            buttons = []
            for unique_code, animal_code, is_marked, telegram_tag in matches:
                status = "✅" if is_marked else "❌"
                display_text = f"{status} {animal_code} ({unique_code})"
                
                if is_marked:
                    callback_data = f"unmark_user_{condition_field}_{unique_code}_{telegram_tag}"
                else:
                    callback_data = f"mark_user_{unique_code}"
                    
                buttons.append([InlineKeyboardButton(display_text, callback_data=callback_data)])

            buttons.append([InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')])
            reply_markup = InlineKeyboardMarkup(buttons)

            await self.safe_edit_message(
                context,
                chat_id,
                main_message_id,
                "🔍 Выберите пользователя:\n❌ - не отмечен\n✅ - отмечен",
                reply_markup
            )

            try:
                await update.message.delete()
            except Exception as e:
                print(f"Ошибка при удалении сообщения с поисковым запросом: {e}")

        except Exception as e:
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            await self.safe_edit_message(
                context,
                chat_id,
                main_message_id,
                f"❌ Произошла ошибка при поиске: {str(e)}",
                reply_markup
            )

    async def handle_mark_user_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE, unique_code: str):
        query = update.callback_query
        user_id = query.from_user.id
        chat_id = query.message.chat.id
        main_message_id = self.get_main_message_id(user_id)

        try:
            with sqlite3.connect('bot_database.db') as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT vg.volunteer_group 
                    FROM VolunteerGroups vg
                    JOIN Users u ON u.id = vg.user_id
                    WHERE u.telegram_id = ?
                ''', (user_id,))
                volunteer_group = cursor.fetchone()

                if not volunteer_group:
                    await query.answer("❌ Ошибка: группа волонтёра не найдена", show_alert=True)
                    return

                volunteer_group = volunteer_group[0]
                condition_field = self.GROUP_TO_CONDITION[volunteer_group]

                cursor.execute(f'''
                    UPDATE ContestLogs 
                    SET {condition_field} = 1
                    WHERE telegram_tag = (
                        SELECT telegram_tag 
                        FROM Users 
                        WHERE unique_code = ?
                    )
                ''', (unique_code,))
                
                cursor.execute('''
                    SELECT animal_code, telegram_tag
                    FROM Users 
                    WHERE unique_code = ?
                ''', (unique_code,))
                result = cursor.fetchone()
                animal_code = result[0]
                telegram_tag = result[1]
                
                conn.commit()

            self.log_action(
                user_id,
                f"Волонтёр отметил {condition_field} для пользователя {animal_code} ({unique_code})"
            )

            buttons = [
                [InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')],
                [InlineKeyboardButton("❌ Отмена отметки", callback_data=f'cancel_mark_condition_{condition_field}_{unique_code}_{telegram_tag}')]
            ]
            reply_markup = InlineKeyboardMarkup(buttons)

            activity_name = self.get_activity_name(condition_field)
            await self.safe_edit_message(
                context,
                chat_id,
                main_message_id,
                f"✅ Успешно отмечена активность «{activity_name}» для пользователя {animal_code} ({unique_code})",
                reply_markup
            )

        except Exception as e:
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            await self.safe_edit_message(
                context,
                chat_id,
                main_message_id,
                f"❌ Ошибка при отметке условия: {str(e)}",
                reply_markup
            )

    async def unmark_condition_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = update.effective_user.id
        buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
        reply_markup = InlineKeyboardMarkup(buttons)
        main_message_id = self.get_main_message_id(user_id)
        
        if not main_message_id:
            await update.message.reply_text("Ошибка: не найдено главное сообщение. Используйте /start для начала работы.")
            return
        
        role = self.get_user_role(user_id)
        if role not in ['Волонтёр', 'Организатор']:
            await self.safe_edit_message(
                context,
                update.effective_chat.id,
                main_message_id,
                "⛔ Эта команда доступна только для волонтеров и организаторов.",
                reply_markup
            )
            try:
                await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=update.message.message_id)
            except Exception as e:
                print(f"Ошибка при удалении сообщения с командой: {e}")
            return

        if role == 'Организатор' and len(context.args) != 2:
            await self.safe_edit_message(
                context,
                update.effective_chat.id,
                main_message_id,
                (
                    "❌ Неверный формат команды.\n"
                    "Используйте: <code>/unmark &lt;код или позывной&gt; &lt;группа&gt;</code>\n"
                    f"Доступные группы: {', '.join(sorted(self.VOLUNTEER_GROUPS))}\n"
                    "Пример: <code>/unmark Лиса#1 А</code>"
                ),
                reply_markup,
                parse_mode="HTML"
                            )
            try:
                await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=update.message.message_id)
            except Exception as e:
                print(f"Ошибка при удалении сообщения с командой: {e}")
            return
        elif role == 'Волонтёр' and len(context.args) != 1:
            await self.safe_edit_message(
                context,
                update.effective_chat.id,
                main_message_id,
                (
                    "❌ Неверный формат команды.\n"
                    "Используйте: <code>/unmark &lt;код или позывной&gt;</code>\n"
                    "Пример: <code>/unmark Лиса#1</code>"
                ),
                reply_markup,
                parse_mode="HTML"
            )
            try:
                await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=update.message.message_id)
            except Exception as e:
                print(f"Ошибка при удалении сообщения с командой: {e}")
            return

        try:
            target_code_or_call_sign = self.standardize_call_sign(context.args[0])

            with sqlite3.connect('bot_database.db') as conn:
                cursor = conn.cursor()
                
                if role == 'Волонтёр':
                    cursor.execute('''
                        SELECT vg.volunteer_group 
                        FROM VolunteerGroups vg
                        JOIN Users u ON u.id = vg.user_id
                        WHERE u.telegram_id = ?
                    ''', (user_id,))
                    volunteer_group = cursor.fetchone()
                    
                    if not volunteer_group:
                        await self.safe_edit_message(
                            context,
                            update.effective_chat.id,
                            main_message_id,
                            "❌ Ошибка: группа волонтёра не найдена.",
                            reply_markup,
                            parse_mode="HTML"
                        )
                        return
                    
                    volunteer_group = volunteer_group[0]
                    condition_field = self.GROUP_TO_CONDITION[volunteer_group]
                else:
                    volunteer_group = context.args[1].upper()
                    if volunteer_group not in self.VOLUNTEER_GROUPS:
                        await self.safe_edit_message(
                            context,
                            update.effective_chat.id,
                            main_message_id,
                            f"❌ Неверная группа. Доступные группы: {', '.join(sorted(self.VOLUNTEER_GROUPS))}",
                            reply_markup,
                            parse_mode="HTML"
                        )
                        return
                    condition_field = self.GROUP_TO_CONDITION[volunteer_group]

                cursor.execute('''
                    SELECT u.telegram_tag, u.animal_code
                    FROM Users u
                    WHERE LOWER(u.unique_code) = LOWER(?) OR LOWER(u.animal_code) = LOWER(?)
                ''', (target_code_or_call_sign, target_code_or_call_sign))
                
                user_data = cursor.fetchone()
                if not user_data:
                    await self.safe_edit_message(
                        context,
                        update.effective_chat.id,
                        main_message_id,
                        "❌ Указанный пользователь не найден.",
                        reply_markup,
                        parse_mode="HTML"
                    )
                    return

                telegram_tag, animal_code = user_data

                cursor.execute(f'''
                    UPDATE ContestLogs 
                    SET {condition_field} = 0
                    WHERE telegram_tag = ?
                ''', (telegram_tag,))
                
                conn.commit()

                self.log_action(
                    user_id,
                    f"{role} отменил отметку активности «{self.get_activity_name(condition_field)}» для пользователя {target_code_or_call_sign}"
                )

            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            
            activity_name = self.get_activity_name(condition_field)
            await self.safe_edit_message(
                context,
                update.effective_chat.id,
                main_message_id,
                f"✅ Успешно отменена отметка активности «{activity_name}» для пользователя {animal_code}",
                reply_markup,
                parse_mode="HTML"
            )

        except Exception as e:
            await self.safe_edit_message(
                context,
                update.effective_chat.id,
                main_message_id,
                f"❌ Ошибка при отмене отметки: {str(e)}",
                reply_markup,
                parse_mode="HTML"
            )

        try:
            await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=update.message.message_id)
        except Exception as e:
            print(f"Ошибка при удалении сообщения с командой: {e}")

    async def handle_unmark_user_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE, data: str):
        query = update.callback_query
        user_id = query.from_user.id
        chat_id = query.message.chat.id
        main_message_id = self.get_main_message_id(user_id)

        try:
            parts = data.split('_')
            condition_field = parts[0]
            unique_code = parts[1]
            telegram_tag = '_'.join(parts[2:])

            with sqlite3.connect('bot_database.db') as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT animal_code
                    FROM Users 
                    WHERE unique_code = ?
                ''', (unique_code,))
                result = cursor.fetchone()
                
                if not result:
                    await query.answer("❌ Пользователь не найден", show_alert=True)
                    return
                    
                animal_code = result[0]
                
                cursor.execute(f'''
                    UPDATE ContestLogs 
                    SET {condition_field} = 0
                    WHERE telegram_tag = ?
                ''', (telegram_tag,))
                
                conn.commit()

            self.log_action(
                user_id,
                f"Отменена отметка {condition_field} для пользователя {animal_code} ({unique_code})"
            )

            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)

            activity_name = self.get_activity_name(condition_field)
            await self.safe_edit_message(
                context,
                chat_id,
                main_message_id,
                f"✅ Успешно отменена отметка активности «{activity_name}» для пользователя {animal_code}",
                reply_markup,
                parse_mode="HTML"
            )

        except Exception as e:
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            await self.safe_edit_message(
                context,
                chat_id,
                main_message_id,
                f"❌ Ошибка при отмене отметки: {str(e)}",
                reply_markup
            )

    def get_main_message_id(self, user_id):
        with sqlite3.connect('bot_database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT main_message_id FROM UserMainMessages WHERE telegram_id = ?', (user_id,))
            result = cursor.fetchone()
            return result[0] if result else None

    async def cancel_action(self, update: Update, context: ContextTypes.DEFAULT_TYPE, action_type: str):
        query = update.callback_query
        user_id = query.from_user.id
        chat_id = query.message.chat.id
        
        if self.get_user_role(user_id) not in ['Организатор', 'Волонтёр']:
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            await query.edit_message_text(
                "⛔ У вас нет доступа к этой команде.",
                reply_markup=reply_markup
            )
            return

        try:
            callback_data = query.data
            if '_' in callback_data and 'condition' in callback_data:
                parts = callback_data.split('_')
                if len(parts) >= 5:
                    condition = parts[3]
                    unique_code = parts[4]
                    telegram_tag = '_'.join(parts[5:])
                    
                    activity_name = self.get_activity_name(condition)
                    
                    with sqlite3.connect('bot_database.db') as conn:
                        cursor = conn.cursor()
                        cursor.execute(f'''
                            UPDATE ContestLogs 
                            SET {condition} = 0
                            WHERE telegram_tag = ?
                        ''', (telegram_tag,))
                        conn.commit()
                        
                    self.log_action(user_id, f"Отменена отметка активности «{activity_name}» для пользователя {unique_code}")
            else:
                message_text = query.message.text
                if action_type == 'mark':
                    if "условие" in message_text:
                        parts = message_text.split("условие ")
                        if len(parts) > 1:
                            condition = parts[1].split(" для")[0]
                            user_info = parts[1].split("пользователя ")[1]
                            
                            with sqlite3.connect('bot_database.db') as conn:
                                cursor = conn.cursor()
                                cursor.execute(f'''
                                    UPDATE ContestLogs 
                                    SET {condition} = 0
                                    WHERE telegram_tag = (
                                        SELECT telegram_tag 
                                        FROM Users 
                                        WHERE LOWER(unique_code) = LOWER(?) OR LOWER(animal_code) = LOWER(?)
                                    )
                                ''', (user_info, user_info))
                                conn.commit()
                                
                            self.log_action(user_id, f"Отменена отметка {condition} для пользователя {user_info}")
                
                elif action_type == 'add_volunteer':
                    if "Код или позывной:" in message_text:
                        code_line = [line for line in message_text.split('\n') if "Код или позывной:" in line][0]
                        group_line = [line for line in message_text.split('\n') if "Группа:" in line][0]
                        
                        volunteer_code = code_line.split(": ")[1]
                        volunteer_group = group_line.split(": ")[1]
                        
                        with sqlite3.connect('bot_database.db') as conn:
                            cursor = conn.cursor()
                            cursor.execute('''
                                SELECT id 
                                FROM Users 
                                WHERE LOWER(unique_code) = LOWER(?) OR LOWER(animal_code) = LOWER(?)
                            ''', (volunteer_code, volunteer_code))
                            user_data = cursor.fetchone()
                            
                            if user_data:
                                cursor.execute('DELETE FROM VolunteerGroups WHERE user_id = ?', (user_data[0],))
                                cursor.execute('''
                                    UPDATE Users 
                                    SET role = 'Пользователь'
                                    WHERE id = ?
                                ''', (user_data[0],))
                                conn.commit()
                                
                            self.log_action(user_id, f"Отменено добавление волонтера {volunteer_code} в группу {volunteer_group}")

            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            await query.edit_message_text(
                "✅ Действие успешно отменено.",
                reply_markup=reply_markup
            )

        except Exception as e:
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            await query.edit_message_text(
                f"❌ Ошибка при отмене действия: {str(e)}",
                reply_markup=reply_markup
            )

    async def show_user_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        user_id = query.from_user.id
        chat_id = query.message.chat.id
        main_message_id = self.get_main_message_id(user_id)

        buttons = [
            [InlineKeyboardButton("🗺 Карта активностей", callback_data='get_map')],
            [InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]
        ]
        reply_markup = InlineKeyboardMarkup(buttons)

        try:
            with sqlite3.connect('bot_database.db') as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT cl.condition1, cl.condition2, cl.condition3,
                           u.animal_code, u.unique_code
                    FROM ContestLogs cl
                    JOIN Users u ON u.telegram_tag = cl.telegram_tag
                    WHERE u.telegram_id = ?
                ''', (user_id,))
                result = cursor.fetchone()

                if not result:
                    await self.safe_edit_message(
                        context,
                        chat_id,
                        main_message_id,
                        "❌ Не удалось найти информацию о вашем прогрессе.",
                        reply_markup
                    )
                    return

                conditions = result[:3]
                animal_code = result[3]
                unique_code = result[4]

                completed = sum(conditions)
                
                status_message = "✨ <b>Ваш текущий статус:</b>\n\n"
                status_message += f"🏷 Позывной: <code>{animal_code}</code>\n"
                status_message += f"🔢 Код: <code>{unique_code}</code>\n\n"
                status_message += f"📊 Прогресс: {completed}/3 активностей\n"
                
                progress_bar = "".join(['🟢' if c else '⚪' for c in conditions])
                status_message += f"{progress_bar}\n\n"
                
                status_message += "<b>Статус активностей:</b>\n"
                for i, condition in enumerate(conditions, 1):
                    status = "✅" if condition else "❌"
                    activity_name = self.MAP_DOT_NAME[f'Акт{i}']
                    status_message += f"{status} {activity_name}\n"

                if completed < 3:
                    status_message += "\n💡 <i>Подсказка: Нажмите кнопку «Карта активностей» "
                    status_message += "чтобы увидеть расположение непройденных точек.</i>"
                else:
                    status_message += "\n🎉 <b>Поздравляем! Вы прошли все активности!</b>"

                await self.safe_edit_message(
                    context,
                    chat_id,
                    main_message_id,
                    status_message,
                    reply_markup,
                    parse_mode="HTML"
                )

        except Exception as e:
            error_msg = f"❌ Произошла ошибка при получении статуса: {str(e)}"
            logger.error(f"Error in show_user_status for user {user_id}: {str(e)}")
            await self.safe_edit_message(
                context,
                chat_id,
                main_message_id,
                error_msg,
                reply_markup
            )

    async def show_volunteers_list(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        user_id = query.from_user.id
        chat_id = query.message.chat.id
        main_message_id = self.get_main_message_id(user_id)

        if self.get_user_role(user_id) != 'Организатор':
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            await self.safe_edit_message(
                context,
                chat_id,
                main_message_id,
                "⛔ У вас нет доступа к этой функции.",
                reply_markup
            )
            return

        try:
            with sqlite3.connect('bot_database.db') as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT 
                        u.telegram_tag,
                        u.unique_code,
                        u.animal_code,
                        vg.volunteer_group,
                        u.full_name
                    FROM Users u
                    JOIN VolunteerGroups vg ON vg.user_id = u.id
                    WHERE u.role = ?
                    ORDER BY vg.volunteer_group, u.animal_code
                ''', ('Волонтёр',))
                volunteers = cursor.fetchall()

                if not volunteers:
                    buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
                    reply_markup = InlineKeyboardMarkup(buttons)
                    await self.safe_edit_message(
                        context,
                        chat_id,
                        main_message_id,
                        "📝 Список волонтёров пуст.",
                        reply_markup
                    )
                    return

                message = "📋 <b>Список волонтёров:</b>\n\n"
                buttons = []
                
                current_group = None
                for tag, code, animal, group, full_name in volunteers:
                    if current_group != group:
                        current_group = group
                        message += f"\n<b>Группа {group}:</b>\n"
                    
                    condition_field = self.GROUP_TO_CONDITION[group]
                    cursor.execute(f'''
                        SELECT COUNT(*) 
                        FROM ContestLogs 
                        WHERE telegram_tag = ? 
                        AND {condition_field} = 1
                    ''', (tag,))
                    marks_count = cursor.fetchone()[0]
                    
                    activity_name = self.get_activity_name(condition_field)
                    message += f"👤 {animal} ({code}) - {full_name} - {marks_count} отметок\n"
                    
                    buttons.append([
                        InlineKeyboardButton(
                            f"{group} | {animal}",
                            callback_data=f"volunteer_info_{code}"
                        )
                    ])

                buttons.append([InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')])
                reply_markup = InlineKeyboardMarkup(buttons)

                await self.safe_edit_message(
                    context,
                    chat_id,
                    main_message_id,
                    message,
                    reply_markup,
                    parse_mode="HTML"
                )

        except Exception as e:
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            error_message = f"❌ Ошибка при получении списка волонтёров: {str(e)}"
            print(f"Error in show_volunteers_list: {str(e)}")
            await self.safe_edit_message(
                context,
                chat_id,
                main_message_id,
                error_message,
                reply_markup
            )

    async def show_volunteer_info(self, update: Update, context: ContextTypes.DEFAULT_TYPE, volunteer_code: str):
        query = update.callback_query
        user_id = query.from_user.id
        chat_id = query.message.chat.id
        main_message_id = self.get_main_message_id(user_id)

        try:
            with sqlite3.connect('bot_database.db') as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT 
                        u.telegram_tag,
                        u.unique_code,
                        u.animal_code,
                        vg.volunteer_group,
                        u.id,
                        u.full_name
                    FROM Users u
                    JOIN VolunteerGroups vg ON vg.user_id = u.id
                    WHERE u.unique_code = ?
                ''', (volunteer_code,))
                volunteer = cursor.fetchone()

                if not volunteer:
                    await query.answer("❌ Волонтёр не найден", show_alert=True)
                    return

                tag, code, animal, group, user_id_db, full_name = volunteer
                condition_field = self.GROUP_TO_CONDITION[group]
                activity_name = self.get_activity_name(condition_field)

                cursor.execute(f'''
                    SELECT COUNT(*) 
                    FROM ContestLogs 
                    WHERE {condition_field} = 1
                    AND telegram_tag = ?
                ''', (tag,))
                marks_count = cursor.fetchone()[0]

                message = f"ℹ️ <b>Информация о волонтёре:</b>\n\n"
                message += f"🏷 Позывной: <code>{animal}</code>\n"
                message += f"🔢 Код: <code>{code}</code>\n"
                message += f"👤 Тег: {tag}\n"
                message += f"📍 Группа: {group}\n"
                message += f"📛 ФИО: {full_name}\n"
                message += f"🎯 Активность: {activity_name}\n"
                message += f"📊 Количество отметок: {marks_count}\n"

                buttons = [
                    [InlineKeyboardButton("❌ Снять с роли волонтёра", callback_data=f"remove_volunteer_{code}")],
                    [InlineKeyboardButton("↩️ К списку волонтёров", callback_data="show_volunteers")],
                    [InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data="return_to_main")]
                ]
                reply_markup = InlineKeyboardMarkup(buttons)

                await self.safe_edit_message(
                    context,
                    chat_id,
                    main_message_id,
                    message,
                    reply_markup,
                    parse_mode="HTML"
                )

        except Exception as e:
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            await self.safe_edit_message(
                context,
                chat_id,
                main_message_id,
                f"❌ Ошибка при получении информации о волонтёре: {str(e)}",
                reply_markup
            )

    async def remove_volunteer_role(self, update: Update, context: ContextTypes.DEFAULT_TYPE, volunteer_code: str):
        query = update.callback_query
        user_id = query.from_user.id
        chat_id = query.message.chat.id
        main_message_id = self.get_main_message_id(user_id)

        if self.get_user_role(user_id) != 'Организатор':
            await query.answer("⛔ У вас нет прав для этого действия", show_alert=True)
            return

        try:
            with sqlite3.connect('bot_database.db') as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT u.animal_code, u.id, vg.volunteer_group
                    FROM Users u
                    LEFT JOIN VolunteerGroups vg ON vg.user_id = u.id
                    WHERE u.unique_code = ?
                ''', (volunteer_code,))
                result = cursor.fetchone()
                
                if not result:
                    await query.answer("❌ Волонтёр не найден", show_alert=True)
                    return

                animal_code, vol_user_id, volunteer_group = result

                cursor.execute('DELETE FROM VolunteerGroups WHERE user_id = ?', (vol_user_id,))
                
                cursor.execute('''
                    UPDATE Users 
                    SET role = 'Пользователь'
                    WHERE id = ?
                ''', (vol_user_id,))
                
                conn.commit()

            self.log_action(
                user_id,
                f"Удалил роль волонтёра у пользователя {animal_code} ({volunteer_code}) из группы {volunteer_group}"
            )

            buttons = [
                [InlineKeyboardButton("↩️ К списку волонтёров", callback_data="show_volunteers")],
                [InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data="return_to_main")]
            ]
            reply_markup = InlineKeyboardMarkup(buttons)

            await self.safe_edit_message(
                context,
                chat_id,
                main_message_id,
                f"✅ Пользователь {animal_code} успешно снят с роли волонтёра",
                reply_markup
            )

        except Exception as e:
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            await self.safe_edit_message(
                context,
                chat_id,
                main_message_id,
                f"❌ Ошибка при удалении роли волонтёра: {str(e)}",
                reply_markup
            )

    async def stat_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = update.effective_user.id
        main_message_id = self.get_main_message_id(user_id)
        
        if not main_message_id:
            await update.message.reply_text("Ошибка: не найдено главное сообщение. Используйте /start для начала работы.")
            return
            
        role = self.get_user_role(user_id)
        
        if role != 'Организатор':
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            await context.bot.edit_message_text(
                chat_id=update.effective_chat.id,
                message_id=main_message_id,
                text="⛔ У вас нет доступа к этой команде.",
                reply_markup=reply_markup
            )
            return

        self.log_action(user_id, "Использована команда /stat")
        
        with sqlite3.connect('bot_database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT 
                    cl.animal_code,
                    cl.telegram_tag,
                    (cl.condition1 + cl.condition2 + cl.condition3 + cl.condition4 + cl.condition5) as completed_conditions
                FROM ContestLogs cl
                ORDER BY completed_conditions DESC
                LIMIT 10
            ''')
            stats = cursor.fetchall()

        if not stats:
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            await context.bot.edit_message_text(
                chat_id=update.effective_chat.id,
                message_id=main_message_id,
                text="Статистика пока отсутствует.",
                reply_markup=reply_markup
            )
            return

        response = "📊 Статистика конкурса:\n\n"
        for animal_code, telegram_tag, completed in stats:
            response += f"🏷 {animal_code} | {telegram_tag or 'Нет тега'} | {completed}/5 ✅ \n\n"
        
        buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
        reply_markup = InlineKeyboardMarkup(buttons)
        
        await context.bot.edit_message_text(
            chat_id=update.effective_chat.id,
            message_id=main_message_id,
            text=response,
            reply_markup=reply_markup
        )

    async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        user_id = query.from_user.id
        chat_id = query.message.chat.id

        with sqlite3.connect('bot_database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT main_message_id, map_message_id, event_message_id FROM UserMainMessages WHERE telegram_id = ?', (user_id,))
            row = cursor.fetchone()
            if row:
                main_message_id, map_message_id, event_message_id = row
            else:
                await query.answer("Ошибка: не найдено главное сообщение", show_alert=True)
                return

        if query.data == 'return_to_main':
            if map_message_id:
                try:
                    await context.bot.delete_message(chat_id=chat_id, message_id=map_message_id)
                    cursor.execute('UPDATE UserMainMessages SET map_message_id = NULL WHERE telegram_id = ?', (user_id,))
                    conn.commit()
                except Exception as e:
                    print(f"Ошибка при удалении карты: {e}")

            if event_message_id:
                try:
                    await context.bot.delete_message(chat_id=chat_id, message_id=event_message_id)
                    cursor.execute('UPDATE UserMainMessages SET event_message_id = NULL WHERE telegram_id = ?', (user_id,))
                    conn.commit()
                except Exception as e:
                    print(f"Ошибка при удалении сообщения о мероприятии: {e}")

            role = self.get_user_role(user_id)
            cursor.execute('''
                SELECT cl.animal_code, u.unique_code, cl.condition1, cl.condition2, cl.condition3 
                FROM ContestLogs cl
                JOIN Users u ON u.telegram_tag = cl.telegram_tag
                WHERE u.telegram_id = ?
            ''', (user_id,))
            animal_code, unique_code, *conditions = cursor.fetchone()

            welcome_message = self.welc_msg(animal_code, unique_code)

            buttons = [
                [InlineKeyboardButton("О мероприятии", callback_data='get_event1')],
            ]
            
            if sum(conditions) < 3 and role != 'Организатор' and role != 'Волонтёр':
                buttons.append([InlineKeyboardButton("Получить карту", callback_data='get_map')])
                completed_conditions = sum(conditions)
                if completed_conditions == 3:
                    progress_msg = "\n🎉 Вы прошли все активности"
                else:
                    progress_msg = f"\n🎈 Вы прошли {completed_conditions} из 3 активностей."
                welcome_message += progress_msg
        
            
            if role == 'Организатор':
                buttons.append([InlineKeyboardButton("Получить статистику", callback_data='get_stat')])
                buttons.append([InlineKeyboardButton("👥 Список волонтёров", callback_data='show_volunteers')])
                buttons.append([InlineKeyboardButton("Добавить волонтера", callback_data='add_volunteer')])
                buttons.append([InlineKeyboardButton("Отметить условие", callback_data='mark_condition')])
                buttons.append([InlineKeyboardButton("Отменить отметку", callback_data='unmark_condition')])
            elif role == 'Волонтёр':
                buttons.append([InlineKeyboardButton("Отметить условие", callback_data='mark_condition')])
                buttons.append([InlineKeyboardButton("Отменить отметку", callback_data='unmark_condition')])

            if role == 'Пользователь':
                buttons.append([InlineKeyboardButton("📊 Мой статус", callback_data='show_status')])

            reply_markup = InlineKeyboardMarkup(buttons)

            await context.bot.edit_message_text(
                chat_id=chat_id,
                message_id=main_message_id,
                text=welcome_message,
                reply_markup=reply_markup
            )

        elif query.data == 'cancel_mark_condition':
            await self.cancel_action(update, context, 'mark')
        elif query.data.startswith('cancel_mark_condition_'):
            await self.cancel_action(update, context, 'mark')
        elif query.data == 'cancel_add_volunteer':
            await self.cancel_action(update, context, 'add_volunteer')
        elif query.data == 'show_status':
            await self.show_user_status(update, context)
        elif query.data.startswith('mark_user_'):
            unique_code = query.data.replace('mark_user_', '')
            await self.handle_mark_user_callback(update, context, unique_code)
        elif query.data.startswith('unmark_user_'):
            data = query.data.replace('unmark_user_', '')
            await self.handle_unmark_user_callback(update, context, data)
        elif query.data == 'show_volunteers':
            await self.show_volunteers_list(update, context)
        elif query.data.startswith('volunteer_info_'):
            volunteer_code = query.data.replace('volunteer_info_', '')
            await self.show_volunteer_info(update, context, volunteer_code)
        elif query.data.startswith('remove_volunteer_'):
            volunteer_code = query.data.replace('remove_volunteer_', '')
            await self.remove_volunteer_role(update, context, volunteer_code)
        elif query.data == 'get_map':
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)

            with sqlite3.connect('bot_database.db') as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT condition1, condition2, condition3 FROM ContestLogs cl
                    JOIN Users u ON u.telegram_tag = cl.telegram_tag
                    WHERE u.telegram_id = ?
                ''', (user_id,))
                conditions = cursor.fetchone()

            image_path = 'MAP.jpeg'

            sent_message = await context.bot.send_photo(
                chat_id=chat_id,
                photo=open(image_path, 'rb'),
                caption=self.crd_msg(conditions),
                reply_markup=reply_markup,
                parse_mode="HTML"
            )

            with sqlite3.connect('bot_database.db') as conn:
                cursor = conn.cursor()
                cursor.execute('UPDATE UserMainMessages SET map_message_id = ? WHERE telegram_id = ?', (sent_message.message_id, user_id))
                conn.commit()

            await context.bot.edit_message_text(
                chat_id=chat_id,
                message_id=main_message_id,
                text="🔽 Карта доступна внизу.",
                reply_markup=None
            )
        elif query.data == 'get_event1':
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)

            image_path = 'EVENT1.jpeg'

            sent_message = await context.bot.send_photo(
                chat_id=chat_id,
                photo=open(image_path, 'rb'),
                caption="ℹ️ <b>О мероприятии:</b>\nМероприятие будет проходить в формате ...",
                reply_markup=reply_markup,
                parse_mode="HTML"
            )

            with sqlite3.connect('bot_database.db') as conn:
                cursor = conn.cursor()
                cursor.execute('UPDATE UserMainMessages SET event_message_id = ? WHERE telegram_id = ?', (sent_message.message_id, user_id))
                conn.commit()

            await context.bot.edit_message_text(
                chat_id=chat_id,
                message_id=main_message_id,
                text="ℹ️ Информация о мероприятии доступна внизу.",
                reply_markup=None
            )
        elif query.data == 'get_stat':
            await self.stat_command(update, context)
        elif query.data == 'add_volunteer':
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            await context.bot.edit_message_text(
                chat_id=chat_id,
                message_id=main_message_id,
                reply_markup=reply_markup,
                text="Введите команду /add_volunteer <код или позывной> <группа>"
            )
        elif query.data == 'mark_condition':
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            await context.bot.edit_message_text(
                chat_id=chat_id,
                message_id=main_message_id,
                reply_markup=reply_markup,
                text="Введите команду /mark <код или позывной> <условие>"
            )
        elif query.data == 'unmark_condition':
            buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
            reply_markup = InlineKeyboardMarkup(buttons)
            role = self.get_user_role(user_id)
            
            if role == 'Организатор':
                message = (
                    f"Введите команду /unmark <код или позывной> <группа>\nДоступные группы: {', '.join(sorted(self.VOLUNTEER_GROUPS))}\nПример: /unmark Лиса#1 А"
                )
            else:
                message = (
                    f"Введите команду /unmark <код или позывной>\nПример: /unmark Лиса#123"
                )
            
            await self.safe_edit_message(
                context,
                chat_id,
                main_message_id,
                message,
                reply_markup
            )            

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = update.effective_user.id
        username = update.effective_user.username or "Unknown"
        telegram_tag = f"@{username}" if username else None

        self.add_user(user_id, username, telegram_tag)
        self.log_action(user_id, "Использована команда /start")
        
        with sqlite3.connect('bot_database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT cl.animal_code, u.unique_code, cl.condition1, cl.condition2, cl.condition3 
                FROM ContestLogs cl
                JOIN Users u ON u.telegram_tag = cl.telegram_tag
                WHERE u.telegram_id = ?
            ''', (user_id,))
            animal_code, unique_code, *conditions = cursor.fetchone()

        welcome_message = self.welc_msg(animal_code, unique_code)
        
        role = self.get_user_role(user_id)
        buttons = [
            [InlineKeyboardButton("О мероприятии", callback_data='get_event1')],
        ]

        if role == 'Пользователь':
            buttons.append([InlineKeyboardButton("📊 Мой статус", callback_data='show_status')])

        if sum(conditions) < 3 and role != 'Организатор' and role != 'Волонтёр':
            buttons.append([InlineKeyboardButton("Получить карту", callback_data='get_map')])
            completed_conditions = sum(conditions)
            if completed_conditions == 3:
                progress_msg = "\n🎉 Вы прошли все активности"
            else:
                progress_msg = f"\n🎈 Вы прошли {completed_conditions} из 3 активностей."
            welcome_message += progress_msg
        
        
        if role == 'Организатор':
            buttons.append([InlineKeyboardButton("Получить статистику", callback_data='get_stat')])
            buttons.append([InlineKeyboardButton("👥 Список волонтёров", callback_data='show_volunteers')])
            buttons.append([InlineKeyboardButton("Добавить волонтера", callback_data='add_volunteer')])
            buttons.append([InlineKeyboardButton("Отметить условие", callback_data='mark_condition')])
            buttons.append([InlineKeyboardButton("Отменить отметку", callback_data='unmark_condition')])
        elif role == 'Волонтёр':
            buttons.append([InlineKeyboardButton("Отметить условие", callback_data='mark_condition')])
            buttons.append([InlineKeyboardButton("Отменить отметку", callback_data='unmark_condition')])

        reply_markup = InlineKeyboardMarkup(buttons)
        message = await update.message.reply_text(welcome_message, reply_markup=reply_markup)
        
        with sqlite3.connect('bot_database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO UserMainMessages (telegram_id, main_message_id)
                VALUES (?, ?)
            ''', (user_id, message.message_id))
            conn.commit()

        try:
            await update.message.delete()
        except Exception as e:
            print(f"Ошибка при удалении сообщения с командой: {e}")

    async def add_volunteer_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = update.effective_user.id
        buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
        reply_markup = InlineKeyboardMarkup(buttons)
        main_message_id = self.get_main_message_id(user_id)
        if not main_message_id:
            await update.message.reply_text("Ошибка: не найдено главное сообщение. Используйте /start для начала работы.")
            return
        
        if self.get_user_role(user_id) != 'Организатор':
            await self.safe_edit_message(
                context,
                update.effective_chat.id,
                main_message_id,
                "⛔ У вас нет доступа к этой команде.",
                reply_markup
            )
            try:
                await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=update.message.message_id)
            except Exception as e:
                print(f"Ошибка при удалении сообщения с командой: {e}")
            return

        if len(context.args) != 2:
            await self.safe_edit_message(
                context,
                update.effective_chat.id,
                main_message_id,
                (
                    "❌ Неверный формат команды.\n"
                    "Используйте: <code>/add_volunteer &lt;код или позывной&gt; &lt;группа&gt;</code>\n"
                    f"Доступные группы: {', '.join(sorted(self.VOLUNTEER_GROUPS))}\n"
                    "Пример: <code>/add_volunteer 12345 А</code>"
                ),
                reply_markup,
                parse_mode="HTML"
            )
            try:
                await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=update.message.message_id)
            except Exception as e:
                print(f"Ошибка при удалении сообщения с командой: {e}")
            return

        try:
            volunteer_code_or_call_sign = self.standardize_call_sign(context.args[0])
            volunteer_group = context.args[1].upper()

            if volunteer_group not in self.VOLUNTEER_GROUPS:
                await self.safe_edit_message(
                    context,
                    update.effective_chat.id,
                    main_message_id,
                    f"❌ Неверная группа. Доступные группы: {', '.join(sorted(self.VOLUNTEER_GROUPS))}",
                    reply_markup,
                    parse_mode="HTML"
                )
                try:
                    await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=update.message.message_id)
                except Exception as e:
                    print(f"Ошибка при удалении сообщения с командой: {e}")
                return

            with sqlite3.connect('bot_database.db') as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT id, telegram_tag 
                    FROM Users 
                    WHERE LOWER(unique_code) = ? OR LOWER(animal_code) = ?
                ''', (volunteer_code_or_call_sign, volunteer_code_or_call_sign))
                user_data = cursor.fetchone()
                
                if not user_data:
                    await self.safe_edit_message(
                        context,
                        update.effective_chat.id,
                        main_message_id,
                        "❌ Указанный пользователь не найден.",
                        reply_markup,
                        parse_mode="HTML"
                    )
                    return

                user_id_db, telegram_tag = user_data

                cursor.execute('''
                    UPDATE Users 
                    SET role = 'Волонтёр'
                    WHERE id = ?
                ''', (user_id_db,))

                cursor.execute('DELETE FROM VolunteerGroups WHERE user_id = ?', (user_id_db,))
                cursor.execute('''
                    INSERT INTO VolunteerGroups (user_id, volunteer_group)
                    VALUES (?, ?)
                ''', (user_id_db, volunteer_group))

                conn.commit()

                self.log_action(user_id, f"Добавлен волонтер (Код или позывной: {volunteer_code_or_call_sign}) в группу {volunteer_group}")
                
                buttons = [
                    [InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')],
                    [InlineKeyboardButton("❌ Отмена добавления", callback_data='cancel_add_volunteer')]
                ]
                reply_markup = InlineKeyboardMarkup(buttons)
                
                await self.safe_edit_message(
                    context,
                    update.effective_chat.id,
                    main_message_id,
                    (
                        f"✅ Успешно добавлен волонтер!\n"
                        f"Код или позывной: {volunteer_code_or_call_sign}\n"
                        f"Группа: {volunteer_group}"
                    ),
                    reply_markup,
                    parse_mode="HTML"
                )

        except sqlite3.Error as e:
            await self.safe_edit_message(
                context,
                update.effective_chat.id,
                main_message_id,
                f"❌ Ошибка базы данных: {str(e)}",
                reply_markup,
                parse_mode="HTML"
            )

        try:
            await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=update.message.message_id)
        except Exception as e:
            print(f"Ошибка при удалении сообщения с командой: {e}")

    async def mark_condition_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = update.effective_user.id
        buttons = [[InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')]]
        reply_markup = InlineKeyboardMarkup(buttons)
        main_message_id = self.get_main_message_id(user_id)
        
        if not main_message_id:
            await update.message.reply_text("Ошибка: не найдено главное сообщение. Используйте /start для начала работы.")
            return
        
        role = self.get_user_role(user_id)
        if role not in ['Волонтёр', 'Организатор']:
            await self.safe_edit_message(
                context,
                update.effective_chat.id,
                main_message_id,
                "⛔ Эта команда доступна только для волонтеров и организаторов.",
                reply_markup
            )
            try:
                await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=update.message.message_id)
            except Exception as e:
                print(f"Ошибка при удалении сообщения с командой: {e}")
            return

        if role == 'Организатор' and len(context.args) != 2:
            await self.safe_edit_message(
                context,
                update.effective_chat.id,
                main_message_id,
                (
                    "❌ Неверный формат команды.\n"
                    "Используйте: <code>/mark &lt;код или позывной&gt; &lt;группа&gt;</code>\n"
                    f"Доступные группы: {', '.join(sorted(self.VOLUNTEER_GROUPS))}"
                ),
                reply_markup,
                parse_mode="HTML"
            )
            try:
                await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=update.message.message_id)
            except Exception as e:
                print(f"Ошибка при удалении сообщения с командой: {e}")
            return
        elif role == 'Волонтёр' and len(context.args) != 1:
            await self.safe_edit_message(
                context,
                update.effective_chat.id,
                main_message_id,
                (
                    "❌ Неверный формат команды.\n"
                    "Используйте: <code>/mark &lt;код или позывной&gt;</code>"
                ),
                reply_markup,
                parse_mode="HTML"
            )
            try:
                await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=update.message.message_id)
            except Exception as e:
                print(f"Ошибка при удалении сообщения с командой: {e}")
            return

        try:
            target_code_or_call_sign = self.standardize_call_sign(context.args[0])

            with sqlite3.connect('bot_database.db') as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT u.id, u.telegram_tag, cl.id as contest_log_id
                    FROM Users u
                    LEFT JOIN ContestLogs cl ON u.telegram_tag = cl.telegram_tag
                    WHERE LOWER(u.unique_code) = ? OR LOWER(u.animal_code) = ?
                ''', (target_code_or_call_sign, target_code_or_call_sign))
                
                target_user = cursor.fetchone()
                if not target_user:
                    await self.safe_edit_message(
                        context,
                        update.effective_chat.id,
                        main_message_id,
                        "❌ Указанный пользователь не найден.",
                        reply_markup,
                        parse_mode="HTML"
                    )
                    return
                
                target_user_id, target_telegram_tag, contest_log_id = target_user
                
                if role == "Волонтёр":
                    cursor.execute('SELECT id FROM Users WHERE telegram_id = ?', (user_id,))
                    user_db_id = cursor.fetchone()
                    
                    if not user_db_id:
                        await self.safe_edit_message(
                            context,
                            update.effective_chat.id,
                            main_message_id,
                            "❌ Ошибка: пользователь не найден в базе данных.",
                            reply_markup,
                            parse_mode="HTML"
                        )
                        return
                        
                    cursor.execute('''
                        SELECT volunteer_group 
                        FROM VolunteerGroups 
                        WHERE user_id = ?
                    ''', (user_db_id[0],))
                    volunteer_group_data = cursor.fetchone()
                    
                    if not volunteer_group_data:
                        await self.safe_edit_message(
                            context,
                            update.effective_chat.id,
                            main_message_id,
                            "❌ Вы не привязаны к группе.",
                            reply_markup,
                            parse_mode="HTML"
                        )
                        return
                    
                    volunteer_group = volunteer_group_data[0]
                    condition_field = self.GROUP_TO_CONDITION[volunteer_group]
                else:
                    volunteer_group = context.args[1].upper()
                    if volunteer_group not in self.VOLUNTEER_GROUPS:
                        await self.safe_edit_message(
                            context,
                            update.effective_chat.id,
                            main_message_id,
                            f"❌ Неверная группа. Доступные группы: {', '.join(sorted(self.VOLUNTEER_GROUPS))}",
                            reply_markup,
                            parse_mode="HTML"
                        )
                        return
                    condition_field = self.GROUP_TO_CONDITION[volunteer_group]

                cursor.execute(f'''
                    UPDATE ContestLogs 
                    SET {condition_field} = 1
                    WHERE telegram_tag = ?
                ''', (target_telegram_tag,))
                
                conn.commit()
                
                self.log_action(
                    user_id,
                    f"{role} отметил активность «{self.get_activity_name(condition_field)}» для пользователя {target_code_or_call_sign}"
                )

                
                buttons = [
                    [InlineKeyboardButton("🔙 Вернуться в главное меню", callback_data='return_to_main')],
                    [InlineKeyboardButton("❌ Отмена отметки", callback_data='cancel_mark_condition')]
                ]
                reply_markup = InlineKeyboardMarkup(buttons)
                
                activity_name = self.get_activity_name(condition_field)
                await self.safe_edit_message(
                    context,
                    update.effective_chat.id,
                    main_message_id,
                    f"✅ Успешно отмечена активность «{activity_name}» для пользователя {target_code_or_call_sign}",
                    reply_markup,
                    parse_mode="HTML"
                )

        except sqlite3.Error as e:
            await self.safe_edit_message(
                context,
                update.effective_chat.id,
                main_message_id,
                f"❌ Ошибка базы данных: {str(e)}",
                reply_markup,
                parse_mode="HTML"
            )

        try:
            await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=update.message.message_id)
        except Exception as e:
            print(f"Ошибка при удалении сообщения с командой: {e}")

    def run(self):
        application = Application.builder().token(self.token).build()
        application.add_handler(CommandHandler("start", self.start_command))
        application.add_handler(CommandHandler("add_volunteer", self.add_volunteer_command))
        application.add_handler(CommandHandler("mark", self.mark_condition_command))
        application.add_handler(CommandHandler("unmark", self.unmark_condition_command))
        application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_volunteer_search))
        application.add_handler(CallbackQueryHandler(self.button_callback))
        print("Бот запущен...")
        application.run_polling()

if __name__ == '__main__':

    logging.basicConfig(
        level=logging.ERROR,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('bot_errors.log', encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    logger = logging.getLogger(__name__)

    def run_bot_with_restart():
        while True:
            try:
                logger.info("Запуск бота...")
                bot = Bot()
                bot.run()
            except Exception as e:
                error_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
                error_msg = f"""
                ⚠️ Критическая ошибка в боте:
                Время: {error_time} UTC
                Тип ошибки: {type(e).__name__}
                Описание: {str(e)}
                Traceback:
                {traceback.format_exc()}
                """
                logger.error(error_msg)
                
                print(f"\nБот остановлен из-за ошибки в {error_time} UTC")
                continue

    try:
        run_bot_with_restart()
    except KeyboardInterrupt:
        print("\nБот остановлен вручную")
        sys.exit(0)
                   
