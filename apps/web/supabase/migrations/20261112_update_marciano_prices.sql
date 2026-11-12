update public.products
set price = case id
  when 'lucuma' then 2.00
  when 'fresa' then 1.50
  when 'mango' then 2.00
  when 'maracuya' then 1.50
  when 'coco' then 2.00
end
where id in ('lucuma', 'fresa', 'mango', 'maracuya', 'coco');
