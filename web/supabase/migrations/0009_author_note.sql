-- Every book page hardcoded the exact same "Author's Note" text regardless
-- of which book was being viewed ("I wrote the first draft of this book
-- over five years..."), and a fabricated press quote attributed to a made
-- -up outlet ("Continental Review"). Neither was ever real, editable data.
-- This adds a genuine, admin-editable Author's Note field; the fake press
-- quote is removed outright in the app code rather than replaced, since no
-- real reviews-with-attribution system exists to back it.

alter table books add column if not exists author_note text;
