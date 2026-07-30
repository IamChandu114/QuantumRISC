`timescale 1ns / 1ps

module ex_mem_tb;

logic clk;
logic reset;
logic enable;

logic [31:0] alu_result_in;
logic [31:0] write_data_in;
logic [4:0] rd_in;

logic RegWrite_in;
logic MemRead_in;
logic MemWrite_in;
logic MemtoReg_in;

logic [31:0] alu_result_out;
logic [31:0] write_data_out;
logic [4:0] rd_out;

logic RegWrite_out;
logic MemRead_out;
logic MemWrite_out;
logic MemtoReg_out;

ex_mem dut(.*);

initial begin
    clk = 0;
    forever #5 clk = ~clk;
end

initial begin

    reset = 1;
    enable = 1;

    #15;

    reset = 0;

    alu_result_in = 32'd30;
    write_data_in = 32'd20;
    rd_in = 5'd3;

    RegWrite_in = 1;
    MemRead_in = 0;
    MemWrite_in = 1;
    MemtoReg_in = 0;

    #10;

    $display("--------------------------------");
    $display("EX/MEM Register Test");
    $display("--------------------------------");
    $display("ALU Result : %d", alu_result_out);
    $display("Write Data : %d", write_data_out);
    $display("RD         : %d", rd_out);
    $display("--------------------------------");

    $finish;

end

endmodule