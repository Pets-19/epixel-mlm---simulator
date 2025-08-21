--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

-- Started on 2025-07-29 09:50:58 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS epixel_mlm_tools;
--
-- TOC entry 3550 (class 1262 OID 16384)
-- Name: epixel_mlm_tools; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE epixel_mlm_tools WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE epixel_mlm_tools OWNER TO postgres;

\connect epixel_mlm_tools

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 227 (class 1255 OID 16406)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16482)
-- Name: business_plan_simulations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_plan_simulations (
    id integer NOT NULL,
    user_id integer,
    genealogy_simulation_id character varying(100),
    business_name character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT business_plan_simulations_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.business_plan_simulations OWNER TO postgres;

--
-- TOC entry 3551 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE business_plan_simulations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.business_plan_simulations IS 'Stores business plan simulations linked to users and genealogy simulations';


--
-- TOC entry 221 (class 1259 OID 16481)
-- Name: business_plan_simulations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.business_plan_simulations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.business_plan_simulations_id_seq OWNER TO postgres;

--
-- TOC entry 3552 (class 0 OID 0)
-- Dependencies: 221
-- Name: business_plan_simulations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.business_plan_simulations_id_seq OWNED BY public.business_plan_simulations.id;


--
-- TOC entry 226 (class 1259 OID 16528)
-- Name: business_plan_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_plan_templates (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    genealogy_type_id integer,
    default_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    default_products jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.business_plan_templates OWNER TO postgres;

--
-- TOC entry 3553 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE business_plan_templates; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.business_plan_templates IS 'Stores templates for business plan configurations (future use)';


--
-- TOC entry 225 (class 1259 OID 16527)
-- Name: business_plan_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.business_plan_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.business_plan_templates_id_seq OWNER TO postgres;

--
-- TOC entry 3554 (class 0 OID 0)
-- Dependencies: 225
-- Name: business_plan_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.business_plan_templates_id_seq OWNED BY public.business_plan_templates.id;


--
-- TOC entry 224 (class 1259 OID 16508)
-- Name: business_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_products (
    id integer NOT NULL,
    business_plan_id integer,
    product_name character varying(255) NOT NULL,
    product_price numeric(10,2) NOT NULL,
    business_volume numeric(10,2) NOT NULL,
    product_sales_ratio numeric(5,2) NOT NULL,
    product_type character varying(50) NOT NULL,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT business_products_business_volume_check CHECK ((business_volume >= (0)::numeric)),
    CONSTRAINT business_products_product_price_check CHECK ((product_price > (0)::numeric)),
    CONSTRAINT business_products_product_sales_ratio_check CHECK (((product_sales_ratio >= (0)::numeric) AND (product_sales_ratio <= (100)::numeric))),
    CONSTRAINT business_products_product_type_check CHECK (((product_type)::text = ANY ((ARRAY['membership'::character varying, 'retail'::character varying, 'digital'::character varying])::text[]))),
    CONSTRAINT business_products_sales_ratio_check CHECK (((product_sales_ratio >= (0)::numeric) AND (product_sales_ratio <= (100)::numeric)))
);


ALTER TABLE public.business_products OWNER TO postgres;

--
-- TOC entry 3555 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE business_products; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.business_products IS 'Stores products associated with business plan simulations';


--
-- TOC entry 3556 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN business_products.product_sales_ratio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.business_products.product_sales_ratio IS 'Product purchase rate as a percentage (0-100)';


--
-- TOC entry 223 (class 1259 OID 16507)
-- Name: business_products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.business_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.business_products_id_seq OWNER TO postgres;

--
-- TOC entry 3557 (class 0 OID 0)
-- Dependencies: 223
-- Name: business_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.business_products_id_seq OWNED BY public.business_products.id;


--
-- TOC entry 219 (class 1259 OID 16425)
-- Name: genealogy_nodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.genealogy_nodes (
    id integer NOT NULL,
    user_id integer,
    genealogy_type_id integer,
    parent_id integer,
    left_bound integer NOT NULL,
    right_bound integer NOT NULL,
    depth integer DEFAULT 0 NOT NULL,
    "position" character varying(20) DEFAULT 'left'::character varying NOT NULL,
    simulation_id character varying(100),
    payout_cycle integer DEFAULT 1 NOT NULL,
    cycle_position integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.genealogy_nodes OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16424)
-- Name: genealogy_nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.genealogy_nodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.genealogy_nodes_id_seq OWNER TO postgres;

--
-- TOC entry 3558 (class 0 OID 0)
-- Dependencies: 218
-- Name: genealogy_nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.genealogy_nodes_id_seq OWNED BY public.genealogy_nodes.id;


--
-- TOC entry 220 (class 1259 OID 16462)
-- Name: genealogy_simulations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.genealogy_simulations (
    id character varying(100) NOT NULL,
    genealogy_type_id integer,
    max_expected_users integer NOT NULL,
    payout_cycle_type character varying(20) NOT NULL,
    number_of_cycles integer NOT NULL,
    users_per_cycle integer NOT NULL,
    total_nodes_generated integer DEFAULT 0 NOT NULL,
    simulation_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);


ALTER TABLE public.genealogy_simulations OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16409)
-- Name: genealogy_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.genealogy_types (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    max_children_per_node integer DEFAULT 2 NOT NULL,
    rules jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.genealogy_types OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 16408)
-- Name: genealogy_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.genealogy_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.genealogy_types_id_seq OWNER TO postgres;

--
-- TOC entry 3559 (class 0 OID 0)
-- Dependencies: 216
-- Name: genealogy_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.genealogy_types_id_seq OWNED BY public.genealogy_types.id;


--
-- TOC entry 215 (class 1259 OID 16386)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    whatsapp_number character varying(20) NOT NULL,
    organization_name character varying(255),
    country character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['system_admin'::character varying, 'admin'::character varying, 'user'::character varying, 'business_user'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 3560 (class 0 OID 0)
-- Dependencies: 215
-- Name: COLUMN users.role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.role IS 'User role: system_admin, admin, user, or business_user';


--
-- TOC entry 214 (class 1259 OID 16385)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 3561 (class 0 OID 0)
-- Dependencies: 214
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3310 (class 2604 OID 16485)
-- Name: business_plan_simulations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_plan_simulations ALTER COLUMN id SET DEFAULT nextval('public.business_plan_simulations_id_seq'::regclass);


--
-- TOC entry 3319 (class 2604 OID 16531)
-- Name: business_plan_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_plan_templates ALTER COLUMN id SET DEFAULT nextval('public.business_plan_templates_id_seq'::regclass);


--
-- TOC entry 3314 (class 2604 OID 16511)
-- Name: business_products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_products ALTER COLUMN id SET DEFAULT nextval('public.business_products_id_seq'::regclass);


--
-- TOC entry 3300 (class 2604 OID 16428)
-- Name: genealogy_nodes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genealogy_nodes ALTER COLUMN id SET DEFAULT nextval('public.genealogy_nodes_id_seq'::regclass);


--
-- TOC entry 3294 (class 2604 OID 16412)
-- Name: genealogy_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genealogy_types ALTER COLUMN id SET DEFAULT nextval('public.genealogy_types_id_seq'::regclass);


--
-- TOC entry 3290 (class 2604 OID 16389)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3540 (class 0 OID 16482)
-- Dependencies: 222
-- Data for Name: business_plan_simulations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business_plan_simulations (id, user_id, genealogy_simulation_id, business_name, status, created_by, created_at, updated_at) FROM stdin;
1	3	\N	My New Simulator	draft	3	2025-07-28 16:01:02.670869+00	2025-07-28 16:01:02.670869+00
2	4	\N	Premium MLM Plan	draft	4	2025-07-28 16:12:25.4601+00	2025-07-28 16:12:25.4601+00
\.


--
-- TOC entry 3544 (class 0 OID 16528)
-- Dependencies: 226
-- Data for Name: business_plan_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business_plan_templates (id, name, description, genealogy_type_id, default_config, default_products, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3542 (class 0 OID 16508)
-- Dependencies: 224
-- Data for Name: business_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business_products (id, business_plan_id, product_name, product_price, business_volume, product_sales_ratio, product_type, sort_order, is_active, created_at, updated_at) FROM stdin;
1	1	Product-1	100.00	50.00	100.00	retail	1	t	2025-07-28 16:01:02.670869+00	2025-07-28 16:01:02.670869+00
2	2	Premium Membership	99.99	100.00	25.50	membership	1	t	2025-07-28 16:12:25.4601+00	2025-07-28 16:12:25.4601+00
3	2	Digital Course	49.99	50.00	15.25	digital	2	t	2025-07-28 16:12:25.4601+00	2025-07-28 16:12:25.4601+00
\.


--
-- TOC entry 3537 (class 0 OID 16425)
-- Dependencies: 219
-- Data for Name: genealogy_nodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.genealogy_nodes (id, user_id, genealogy_type_id, parent_id, left_bound, right_bound, depth, "position", simulation_id, payout_cycle, cycle_position, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3538 (class 0 OID 16462)
-- Dependencies: 220
-- Data for Name: genealogy_simulations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.genealogy_simulations (id, genealogy_type_id, max_expected_users, payout_cycle_type, number_of_cycles, users_per_cycle, total_nodes_generated, simulation_data, created_at, completed_at) FROM stdin;
\.


--
-- TOC entry 3535 (class 0 OID 16409)
-- Dependencies: 217
-- Data for Name: genealogy_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.genealogy_types (id, name, description, max_children_per_node, rules, is_active, created_at, updated_at) FROM stdin;
1	Binary Plan	Binary tree structure where each node can have maximum 2 child nodes. Nodes are filled from top to bottom, left to right.	2	{"type": "binary", "description": "Each parent node can have maximum 2 children. New nodes are placed in left position first, then right position.", "max_children": 2, "filling_order": "left_to_right", "child_positions": ["left", "right"]}	t	2025-07-25 11:12:42.859436+00	2025-07-25 11:12:42.859436+00
2	Unilevel Plan	Unilevel plan allows unlimited children per parent node, but Max Children Count is used as an average for filling and spilling. If a parent reaches Max Children Count, new children spill to the next available downline node.	10	{"type": "unilevel", "description": "No strict limit per parent, but Max Children Count is used as an average for filling/spilling."}	t	2025-07-25 11:12:42.86323+00	2025-07-25 11:12:42.86323+00
3	Matrix Plan	Matrix plan restricts the number of children per parent node to Max Children Count. If a parent reaches this limit, new children spill to the next available downline node.	3	{"type": "matrix", "description": "Strict limit per parent, Max Children Count controls filling/spilling."}	t	2025-07-25 11:12:42.863927+00	2025-07-25 11:12:42.863927+00
\.


--
-- TOC entry 3533 (class 0 OID 16386)
-- Dependencies: 215
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, name, password_hash, role, whatsapp_number, organization_name, country, created_at, updated_at, is_active) FROM stdin;
2	admin@epixelmlm.com	System Administrator	$2a$12$0OfWikGHJ8daWypVcU9eBOfGEiBlM0Ui34nlWRwQD/q4KjMEku.UW	system_admin	+1234567890	\N	\N	2025-07-28 15:42:04.827571+00	2025-07-28 15:42:04.827571+00	t
3	niro@gmail.com	niro	$2a$12$yjW5opGRbINhi3mbWb0uVO6kVVSvO0bUyTkSvyvhqR9NYjNxAuTyG	business_user	+919744873366	Test	Test	2025-07-28 15:49:32.582727+00	2025-07-28 15:49:32.582727+00	t
4	business@example.com	Business Owner	$2a$12$b7dydSnADf2cqr5AYnaSGePromxhhFh5WA8Yb9e1xeTu3KxLoYO9.	business_user	+1234567891	Test Organization	United States	2025-07-28 16:12:19.850856+00	2025-07-28 16:12:19.850856+00	t
\.


--
-- TOC entry 3562 (class 0 OID 0)
-- Dependencies: 221
-- Name: business_plan_simulations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.business_plan_simulations_id_seq', 2, true);


--
-- TOC entry 3563 (class 0 OID 0)
-- Dependencies: 225
-- Name: business_plan_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.business_plan_templates_id_seq', 1, false);


--
-- TOC entry 3564 (class 0 OID 0)
-- Dependencies: 223
-- Name: business_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.business_products_id_seq', 3, true);


--
-- TOC entry 3565 (class 0 OID 0)
-- Dependencies: 218
-- Name: genealogy_nodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.genealogy_nodes_id_seq', 1, false);


--
-- TOC entry 3566 (class 0 OID 0)
-- Dependencies: 216
-- Name: genealogy_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.genealogy_types_id_seq', 3, true);


--
-- TOC entry 3567 (class 0 OID 0)
-- Dependencies: 214
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- TOC entry 3363 (class 2606 OID 16491)
-- Name: business_plan_simulations business_plan_simulations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_plan_simulations
    ADD CONSTRAINT business_plan_simulations_pkey PRIMARY KEY (id);


--
-- TOC entry 3373 (class 2606 OID 16540)
-- Name: business_plan_templates business_plan_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_plan_templates
    ADD CONSTRAINT business_plan_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 3368 (class 2606 OID 16521)
-- Name: business_products business_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_products
    ADD CONSTRAINT business_products_pkey PRIMARY KEY (id);


--
-- TOC entry 3349 (class 2606 OID 16440)
-- Name: genealogy_nodes genealogy_nodes_left_bound_right_bound_genealogy_type_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genealogy_nodes
    ADD CONSTRAINT genealogy_nodes_left_bound_right_bound_genealogy_type_id_key UNIQUE (left_bound, right_bound, genealogy_type_id);


--
-- TOC entry 3351 (class 2606 OID 16436)
-- Name: genealogy_nodes genealogy_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genealogy_nodes
    ADD CONSTRAINT genealogy_nodes_pkey PRIMARY KEY (id);


--
-- TOC entry 3353 (class 2606 OID 16438)
-- Name: genealogy_nodes genealogy_nodes_user_id_genealogy_type_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genealogy_nodes
    ADD CONSTRAINT genealogy_nodes_user_id_genealogy_type_id_key UNIQUE (user_id, genealogy_type_id);


--
-- TOC entry 3361 (class 2606 OID 16471)
-- Name: genealogy_simulations genealogy_simulations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genealogy_simulations
    ADD CONSTRAINT genealogy_simulations_pkey PRIMARY KEY (id);


--
-- TOC entry 3345 (class 2606 OID 16423)
-- Name: genealogy_types genealogy_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genealogy_types
    ADD CONSTRAINT genealogy_types_name_key UNIQUE (name);


--
-- TOC entry 3347 (class 2606 OID 16421)
-- Name: genealogy_types genealogy_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genealogy_types
    ADD CONSTRAINT genealogy_types_pkey PRIMARY KEY (id);


--
-- TOC entry 3339 (class 2606 OID 16398)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3341 (class 2606 OID 16396)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3343 (class 2606 OID 16400)
-- Name: users users_whatsapp_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_whatsapp_number_key UNIQUE (whatsapp_number);


--
-- TOC entry 3364 (class 1259 OID 16548)
-- Name: idx_business_plan_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_plan_created_by ON public.business_plan_simulations USING btree (created_by);


--
-- TOC entry 3365 (class 1259 OID 16547)
-- Name: idx_business_plan_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_plan_status ON public.business_plan_simulations USING btree (status);


--
-- TOC entry 3366 (class 1259 OID 16546)
-- Name: idx_business_plan_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_plan_user ON public.business_plan_simulations USING btree (user_id);


--
-- TOC entry 3369 (class 1259 OID 16551)
-- Name: idx_business_products_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_products_active ON public.business_products USING btree (is_active);


--
-- TOC entry 3370 (class 1259 OID 16549)
-- Name: idx_business_products_plan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_products_plan ON public.business_products USING btree (business_plan_id);


--
-- TOC entry 3371 (class 1259 OID 16550)
-- Name: idx_business_products_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_products_type ON public.business_products USING btree (product_type);


--
-- TOC entry 3374 (class 1259 OID 16552)
-- Name: idx_business_templates_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_templates_active ON public.business_plan_templates USING btree (is_active);


--
-- TOC entry 3354 (class 1259 OID 16458)
-- Name: idx_genealogy_nodes_bounds; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_genealogy_nodes_bounds ON public.genealogy_nodes USING btree (left_bound, right_bound);


--
-- TOC entry 3355 (class 1259 OID 16461)
-- Name: idx_genealogy_nodes_cycle; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_genealogy_nodes_cycle ON public.genealogy_nodes USING btree (payout_cycle, cycle_position);


--
-- TOC entry 3356 (class 1259 OID 16457)
-- Name: idx_genealogy_nodes_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_genealogy_nodes_parent ON public.genealogy_nodes USING btree (parent_id);


--
-- TOC entry 3357 (class 1259 OID 16460)
-- Name: idx_genealogy_nodes_simulation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_genealogy_nodes_simulation ON public.genealogy_nodes USING btree (simulation_id);


--
-- TOC entry 3358 (class 1259 OID 16456)
-- Name: idx_genealogy_nodes_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_genealogy_nodes_type ON public.genealogy_nodes USING btree (genealogy_type_id);


--
-- TOC entry 3359 (class 1259 OID 16459)
-- Name: idx_genealogy_nodes_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_genealogy_nodes_user ON public.genealogy_nodes USING btree (user_id);


--
-- TOC entry 3332 (class 1259 OID 16480)
-- Name: idx_users_business_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_business_user ON public.users USING btree (role) WHERE ((role)::text = 'business_user'::text);


--
-- TOC entry 3333 (class 1259 OID 16405)
-- Name: idx_users_country; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_country ON public.users USING btree (country);


--
-- TOC entry 3334 (class 1259 OID 16401)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 3335 (class 1259 OID 16404)
-- Name: idx_users_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_organization ON public.users USING btree (organization_name);


--
-- TOC entry 3336 (class 1259 OID 16403)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 3337 (class 1259 OID 16402)
-- Name: idx_users_whatsapp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_whatsapp ON public.users USING btree (whatsapp_number);


--
-- TOC entry 3387 (class 2620 OID 16553)
-- Name: business_plan_simulations update_business_plan_simulations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_business_plan_simulations_updated_at BEFORE UPDATE ON public.business_plan_simulations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3389 (class 2620 OID 16555)
-- Name: business_plan_templates update_business_plan_templates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_business_plan_templates_updated_at BEFORE UPDATE ON public.business_plan_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3388 (class 2620 OID 16554)
-- Name: business_products update_business_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_business_products_updated_at BEFORE UPDATE ON public.business_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3386 (class 2620 OID 16478)
-- Name: genealogy_nodes update_genealogy_nodes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_genealogy_nodes_updated_at BEFORE UPDATE ON public.genealogy_nodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3385 (class 2620 OID 16477)
-- Name: genealogy_types update_genealogy_types_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_genealogy_types_updated_at BEFORE UPDATE ON public.genealogy_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3384 (class 2620 OID 16407)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3379 (class 2606 OID 16502)
-- Name: business_plan_simulations business_plan_simulations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_plan_simulations
    ADD CONSTRAINT business_plan_simulations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3380 (class 2606 OID 16497)
-- Name: business_plan_simulations business_plan_simulations_genealogy_simulation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_plan_simulations
    ADD CONSTRAINT business_plan_simulations_genealogy_simulation_id_fkey FOREIGN KEY (genealogy_simulation_id) REFERENCES public.genealogy_simulations(id);


--
-- TOC entry 3381 (class 2606 OID 16492)
-- Name: business_plan_simulations business_plan_simulations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_plan_simulations
    ADD CONSTRAINT business_plan_simulations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3383 (class 2606 OID 16541)
-- Name: business_plan_templates business_plan_templates_genealogy_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_plan_templates
    ADD CONSTRAINT business_plan_templates_genealogy_type_id_fkey FOREIGN KEY (genealogy_type_id) REFERENCES public.genealogy_types(id);


--
-- TOC entry 3382 (class 2606 OID 16522)
-- Name: business_products business_products_business_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_products
    ADD CONSTRAINT business_products_business_plan_id_fkey FOREIGN KEY (business_plan_id) REFERENCES public.business_plan_simulations(id) ON DELETE CASCADE;


--
-- TOC entry 3375 (class 2606 OID 16446)
-- Name: genealogy_nodes genealogy_nodes_genealogy_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genealogy_nodes
    ADD CONSTRAINT genealogy_nodes_genealogy_type_id_fkey FOREIGN KEY (genealogy_type_id) REFERENCES public.genealogy_types(id) ON DELETE CASCADE;


--
-- TOC entry 3376 (class 2606 OID 16451)
-- Name: genealogy_nodes genealogy_nodes_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genealogy_nodes
    ADD CONSTRAINT genealogy_nodes_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.genealogy_nodes(id) ON DELETE CASCADE;


--
-- TOC entry 3377 (class 2606 OID 16441)
-- Name: genealogy_nodes genealogy_nodes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genealogy_nodes
    ADD CONSTRAINT genealogy_nodes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3378 (class 2606 OID 16472)
-- Name: genealogy_simulations genealogy_simulations_genealogy_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genealogy_simulations
    ADD CONSTRAINT genealogy_simulations_genealogy_type_id_fkey FOREIGN KEY (genealogy_type_id) REFERENCES public.genealogy_types(id) ON DELETE CASCADE;


-- Completed on 2025-07-29 09:50:59 UTC

--
-- PostgreSQL database dump complete
--

